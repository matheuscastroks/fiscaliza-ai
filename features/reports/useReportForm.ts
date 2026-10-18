import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { Problem } from '@/data/mockData';
import type { Analysis } from '@/shared/contracts';
import { problemsApi } from '@/services/mockApi';
import { request, uploadImage } from '@/services/http';
import { analyzeLocally } from '@/demo/localAnalysis';
import { useProblemsStore } from '@/stores/problemsStore';
import { useAuthStore } from '@/stores/authStore';
import { withinMunicipalBounds } from '@/features/city/municipalContext';
export interface ReportFormData {
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  locationSelected: boolean;
  title: string;
  description: string;
  category: Problem['category'];
  priority: Problem['priority'];
  images: string[];
}
const INITIAL_DATA: ReportFormData = {
  address: '',
  neighborhood: '',
  latitude: 0,
  longitude: 0,
  locationSelected: false,
  title: '',
  description: '',
  category: 'road',
  priority: 'medium',
  images: [],
};
export function useReportForm() {
  const user = useAuthStore((s) => s.user);
  const municipality = user?.municipality;
  const key = 'fiscaliza:draft:' + user?.id + ':' + municipality?.id;
  const initialData = useCallback(
    (): ReportFormData => ({
      ...INITIAL_DATA,
      ...municipality?.center,
      neighborhood: user?.neighborhood || '',
    }),
    [municipality, user?.neighborhood],
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<ReportFormData>(INITIAL_DATA);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuggested, setAnalysisSuggested] = useState(false);
  const [analysisSource, setAnalysisSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProblem, setCreatedProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Problem[]>([]);
  const loadProblems = useProblemsStore((s) => s.loadProblems);
  useEffect(() => {
    let active = true;
    readyRef.current = false;
    setReady(false);
    setData(initialData());
    setStep(1);
    setCreatedProblem(null);
    setDuplicates([]);
    setError(null);
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            const value = JSON.parse(raw);
            if (
              typeof value.description === 'string' &&
              Array.isArray(value.images) &&
              typeof value.locationSelected === 'boolean'
            )
              setData({ ...initialData(), ...value });
          } catch {
            /* invalid draft is discarded */
          }
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível recuperar o rascunho.');
      })
      .finally(() => {
        if (active) {
          readyRef.current = true;
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [key, initialData]);
  useEffect(() => {
    if (!ready || createdProblem) return;
    const timer = setTimeout(() => {
      void AsyncStorage.setItem(key, JSON.stringify(data)).catch(() =>
        setError('Não foi possível salvar o rascunho neste aparelho.'),
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [data, key, ready, createdProblem]);
  useEffect(() => {
    if (step !== 3) return;
    let active = true;
    const params = new URLSearchParams({
      description: data.description,
      latitude: String(data.latitude),
      longitude: String(data.longitude),
      category: data.category,
    });
    request<Problem[]>('/duplicates?' + params)
      .then((items) => {
        if (active) setDuplicates(items);
      })
      .catch(() => {
        if (active) setDuplicates([]);
      });
    return () => {
      active = false;
    };
  }, [step, data.description, data.latitude, data.longitude, data.category]);
  const updateField = useCallback(
    <K extends keyof ReportFormData>(field: K, value: ReportFormData[K]) => {
      setData((p) => ({ ...p, [field]: value }));
      setError(null);
    },
    [],
  );
  const updateLocation = useCallback(
    (point: {
      latitude: number;
      longitude: number;
      address?: string;
      neighborhood?: string;
    }) => {
      setData((p) => ({ ...p, ...point, locationSelected: true }));
      setError(null);
    },
    [],
  );
  const nextStep = () => {
    if (step === 1) {
      if (!data.address.trim() || !data.locationSelected) {
        setError('Informe o endereço e marque o ponto da ocorrência.');
        return;
      }
      if (!withinMunicipalBounds(data, municipality)) {
        setError(
          `Escolha um local dentro de ${municipality?.name || 'seu município'}.`,
        );
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (data.description.trim().length < 10) {
        setError('Descreva o que encontrou com pelo menos 10 caracteres.');
        return;
      }
      if (!data.title.trim())
        setData((p) => ({
          ...p,
          title: p.description
            .trim()
            .split(' ')
            .slice(0, 8)
            .join(' ')
            .slice(0, 120),
        }));
      setStep(3);
    }
    setError(null);
  };
  const runLocalSuggestion = async () => {
    if (!data.description.trim()) {
      setError('Descreva o problema antes de pedir uma sugestão.');
      return;
    }
    setIsAnalyzing(true);
    try {
      let result: Analysis;
      try {
        result = await request<Analysis>('/analysis', 'POST', {
          description: data.description,
        });
      } catch {
        result = {
          ...analyzeLocally({ description: data.description }),
          analysisSource: 'heuristic',
        };
      }
      setData((p) => ({
        ...p,
        title: result.suggestedTitle,
        category: result.suggestedCategory,
      }));
      setAnalysisSource(
        result.analysisSource === 'gemini'
          ? 'Sugestão do Gemini. Revise antes de registrar.'
          : 'Sugestão baseada no texto; a imagem não foi analisada.',
      );
      setAnalysisSuggested(true);
      setError(null);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const pickImage = async () => {
    if (data.images.length >= 3) {
      setError('Adicione até três fotos.');
      return;
    }
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Autorize o acesso às fotos ou continue sem anexos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: Platform.OS === 'web',
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
        setError('Escolha uma imagem com até 5 MB.');
        return;
      }
      let uri = asset.uri;
      if (Platform.OS === 'web' && asset.base64)
        uri =
          'data:' +
          (asset.mimeType || 'image/jpeg') +
          ';base64,' +
          asset.base64;
      else if (FileSystem.documentDirectory) {
        const folder = FileSystem.documentDirectory + 'drafts/';
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        uri = folder + Date.now() + '-' + (asset.fileName || 'foto.jpg');
        await FileSystem.copyAsync({ from: asset.uri, to: uri });
      }
      setData((p) => ({ ...p, images: [...p.images, uri] }));
    } catch {
      setError('Não foi possível adicionar a foto. Tente outra imagem.');
    }
  };
  const submitReport = async (userId = user?.id || '') => {
    if (isSubmitting || !readyRef.current) return null;
    if (!data.locationSelected || !withinMunicipalBounds(data, municipality)) {
      setError(
        `Escolha um local dentro de ${municipality?.name || 'seu município'}.`,
      );
      return null;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const images: string[] = [];
      for (const uri of data.images) images.push(await uploadImage(uri));
      setData((p) => ({ ...p, images }));
      const response = await problemsApi.createProblem({
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        priority: data.priority,
        status: 'pending',
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address.trim(),
          neighborhood: data.neighborhood.trim(),
        },
        images,
        reportedBy: userId,
      });
      if (!response.success || !response.data)
        throw new Error(response.error || 'Não foi possível registrar.');
      setCreatedProblem(response.data);
      await AsyncStorage.removeItem(key).catch(() => {});
      await loadProblems();
      return response.data;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível registrar. Seu rascunho foi mantido.',
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setData(initialData());
    setStep(1);
    setCreatedProblem(null);
    setAnalysisSuggested(false);
    setAnalysisSource('');
    setError(null);
    setDuplicates([]);
  };
  return {
    step,
    data,
    updateField,
    updateLocation,
    nextStep,
    prevStep: () => {
      setError(null);
      setStep((p) => (p > 1 ? ((p - 1) as 1 | 2) : p));
    },
    runLocalSuggestion,
    isAnalyzing,
    analysisSuggested,
    analysisSource,
    pickImage,
    removeImage: (index: number) =>
      setData((p) => ({
        ...p,
        images: p.images.filter((_, i) => i !== index),
      })),
    submitReport,
    isSubmitting,
    createdProblem,
    resetForm,
    error,
    duplicates,
    ready,
  };
}
