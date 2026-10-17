import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Problem } from '@/data/mockData';
import { problemsApi } from '@/services/mockApi';
import { analyzeWithAI } from '@/services/aiService';
import { useProblemsStore } from '@/stores/problemsStore';

export interface ReportFormData {
  address: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: Problem['category'];
  priority: Problem['priority'];
  images: string[];
}

const INITIAL_DATA: ReportFormData = {
  address: 'Rua das Palmeiras, Vila Esperança',
  latitude: -22.903,
  longitude: -43.185,
  title: '',
  description: '',
  category: 'road',
  priority: 'medium',
  images: [],
};

export function useReportForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<ReportFormData>(INITIAL_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuggested, setAnalysisSuggested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProblem, setCreatedProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { loadProblems } = useProblemsStore();

  const updateField = useCallback(<K extends keyof ReportFormData>(field: K, value: ReportFormData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const nextStep = useCallback(() => {
    if (step === 1) {
      if (!data.address.trim()) {
        setError('Por favor, informe a localização ou rua da ocorrência.');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!data.description.trim() || data.description.trim().length < 5) {
        setError('Descreva o problema com pelo menos 5 caracteres.');
        return;
      }
      if (!data.title.trim()) {
        // Gera um título automático a partir da descrição se ainda vazio
        const words = data.description.trim().split(' ');
        const autoTitle = words.slice(0, 6).join(' ');
        updateField('title', autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1));
      }
      setError(null);
      setStep(3);
    }
  }, [step, data.address, data.description, data.title, updateField]);

  const prevStep = useCallback(() => {
    setError(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    }
  }, [step]);

  const runLocalSuggestion = useCallback(async () => {
    if (!data.description.trim()) {
      setError('Digite uma breve descrição antes de solicitar a sugestão.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeWithAI({
        description: data.description,
        location: { latitude: data.latitude, longitude: data.longitude },
        imageUri: data.images[0],
      });

      setData((prev) => ({
        ...prev,
        title: result.suggestedTitle || prev.title,
        category: result.suggestedCategory || prev.category,
        priority: result.suggestedPriority || prev.priority,
      }));
      setAnalysisSuggested(true);
      setError(null);
    } catch {
      setError('Não foi possível gerar a sugestão automática.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [data.description, data.latitude, data.longitude, data.images]);

  const pickImage = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permissão de acesso à galeria de fotos necessária.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setData((prev) => ({
          ...prev,
          images: [...prev.images, result.assets[0].uri],
        }));
      }
    } catch {
      setError('Erro ao selecionar foto.');
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  const submitReport = useCallback(async (userId: string = 'demo-citizen') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: data.title.trim() || 'Ocorrência na via pública',
        description: data.description.trim(),
        category: data.category,
        status: 'pending' as const,
        priority: data.priority,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address.trim(),
        },
        images: data.images,
        reportedBy: userId,
      };

      const response = await problemsApi.createProblem(payload);

      if (response.success && response.data) {
        setCreatedProblem(response.data);
        await loadProblems();
        return response.data;
      } else {
        setError(response.error || 'Falha ao registrar ocorrência.');
        return null;
      }
    } catch (err: any) {
      setError(err?.message || 'Erro de comunicação ao salvar ocorrência.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [data, loadProblems]);

  const resetForm = useCallback(() => {
    setData(INITIAL_DATA);
    setStep(1);
    setAnalysisSuggested(false);
    setCreatedProblem(null);
    setError(null);
  }, []);

  return {
    step,
    data,
    updateField,
    nextStep,
    prevStep,
    runLocalSuggestion,
    isAnalyzing,
    analysisSuggested,
    pickImage,
    removeImage,
    submitReport,
    isSubmitting,
    createdProblem,
    resetForm,
    error,
  };
}
