import { analyzeWithRealAI } from '@/services/aiService';
import { problemsApi } from '@/services/mockApi';
import { useAuthStore } from '@/stores/authStore';
import { useProblemsStore } from '@/stores/problemsStore';
import { useStatsStore } from '@/stores/statsStore';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
  const ReactNativeMaps = require('react-native-maps');
  MapView = ReactNativeMaps.default;
  Marker = ReactNativeMaps.Marker;
}
import Animated, {
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}

const categories = [
  { id: 'lighting', name: 'Iluminação', icon: 'lightbulb-outline', color: '#FF9800' },
  { id: 'pothole', name: 'Buracos', icon: 'construction', color: '#F44336' },
  { id: 'trash', name: 'Lixo', icon: 'delete', color: '#9C27B0' },
  { id: 'traffic', name: 'Trânsito', icon: 'traffic', color: '#2196F3' },
  { id: 'water', name: 'Água/Esgoto', icon: 'water-drop', color: '#00BCD4' },
  { id: 'others', name: 'Outros', icon: 'report-problem', color: '#607D8B' },
];

const urgencyLevels = [
  { id: 'low', name: 'Baixa', color: '#4CAF50', description: 'Não há risco imediato' },
  { id: 'medium', name: 'Média', color: '#FF9800', description: 'Requer atenção em breve' },
  { id: 'high', name: 'Alta', color: '#F44336', description: 'Situação de risco' },
];

// Mapeamento das categorias do ReportScreen para o mockData
const categoryMapping: { [key: string]: 'road' | 'lighting' | 'cleaning' | 'others' } = {
  'lighting': 'lighting',
  'pothole': 'road',
  'trash': 'cleaning',
  'traffic': 'others',
  'water': 'others',
  'others': 'others',
};

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  // Stores para notificar atualizações
  const problemsStore = useProblemsStore();
  const statsStore = useStatsStore();
  
  // Form states - REORGANIZADO PARA FLUXO COM IA
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState('medium');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(
    params.userLocation ? JSON.parse(params.userLocation as string) : null
  );
  const [mapRegion, setMapRegion] = useState(
    params.initialRegion ? JSON.parse(params.initialRegion as string) : {
      latitude: -23.550520,
      longitude: -46.633308,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );
  
  // AI states - EXPANDIDO PARA NOVO FLUXO
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    title: string;
    description: string;
    category: string;
    priority: string;
    confidence: number;
    imageAnalysis?: string;
  } | null>(null);
  const [hasUsedAI, setHasUsedAI] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  
  // Stepper states
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Animated values
  const progressValue = useSharedValue(0);

  // NOVO FLUXO DE STEPS - REORGANIZADO PARA IA
  const steps = React.useMemo(() => [
    { 
      id: 'location',
      title: 'Localização', 
      subtitle: 'Onde está o problema?',
      icon: 'location-on', 
      completed: !!selectedLocation,
      required: true
    },
    { 
      id: 'ai-analysis',
      title: 'Descrição & IA', 
      subtitle: 'Descreva e deixe a IA analisar',
      icon: 'auto-awesome', 
      completed: !!hasUsedAI && !!description.trim(),
      required: true
    },
    { 
      id: 'review',
      title: 'Revisar & Editar', 
      subtitle: 'Confirmar informações',
      icon: 'edit', 
      completed: hasUsedAI && !!editableTitle && !!editableDescription,
      required: true
    },
    { 
      id: 'send',
      title: 'Enviar', 
      subtitle: 'Finalizar reporte',
      icon: 'send', 
      completed: true,
      required: false
    }
  ], [selectedLocation, description, hasUsedAI, editableTitle, editableDescription]);

  const currentStepData = steps[currentStep];
  const isCurrentStepValid = currentStepData?.completed || !currentStepData?.required;
  const canGoNext = currentStep < steps.length - 1 && isCurrentStepValid;
  const canGoPrevious = currentStep > 0;
  const isFormValid = description.trim() && selectedCategory && selectedLocation;

  useEffect(() => {
    // Update progress based on current step
    const progress = ((currentStep + 1) / steps.length) * 100;
    progressValue.value = withTiming(progress, { duration: 300 });
  }, [currentStep, progressValue, steps]);

  // Navigation functions
  const goToNextStep = () => {
    if (canGoNext) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (canGoPrevious) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permissão negada', 'Precisamos da sua localização para reportar o problema.');
      return;
    }

    try {
      setIsLoadingAddress(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 10,
      });
      const { latitude, longitude } = location.coords;
      
      // Fazer geocoding reverso para obter o endereço
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        let address = 'Endereço não encontrado';
        if (reverseGeocode.length > 0) {
          const result = reverseGeocode[0];
          const parts = [];
          
          if (result.name) parts.push(result.name);
          if (result.street) parts.push(result.street);
          if (result.streetNumber) parts.push(result.streetNumber);
          if (result.district) parts.push(result.district);
          if (result.city) parts.push(result.city);
          
          address = parts.length > 0 ? parts.join(', ') : 'Endereço não encontrado';
        }

        const newLocation = { latitude, longitude, address };
        setSelectedLocation(newLocation);
      } catch (geocodeError) {
        console.warn('Erro no geocoding reverso:', geocodeError);
        const newLocation = { 
          latitude, 
          longitude, 
          address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}` 
        };
        setSelectedLocation(newLocation);
      }

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização atual.');
      console.log(error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
      setShowPhotoModal(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0]]);
      setShowPhotoModal(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const onMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setIsLoadingAddress(true);
    
    try {
      // Fazer geocoding reverso para obter o endereço
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      let address = 'Endereço não encontrado';
      if (reverseGeocode.length > 0) {
        const result = reverseGeocode[0];
        const parts = [];
        
        if (result.name) parts.push(result.name);
        if (result.street) parts.push(result.street);
        if (result.streetNumber) parts.push(result.streetNumber);
        if (result.district) parts.push(result.district);
        if (result.city) parts.push(result.city);
        
        address = parts.length > 0 ? parts.join(', ') : 'Endereço não encontrado';
      }

      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address
      });
    } catch (error) {
      console.warn('Erro no geocoding reverso:', error);
      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: `Lat: ${coordinate.latitude.toFixed(6)}, Lng: ${coordinate.longitude.toFixed(6)}`
      });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const confirmLocation = () => {
    setShowMapModal(false);
  };

  const handleAIAnalysis = async () => {
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Aviso', 'Por favor, digite uma descrição com pelo menos 10 caracteres antes de usar a IA.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeWithRealAI({
        description,
        imageUri: photos.length > 0 ? photos[0].uri : undefined,
        location: selectedLocation || undefined,
      });

      // Mapear categoria da IA para as categorias do formulário
      const categoryMap: { [key: string]: string } = {
        'road': 'pothole',
        'lighting': 'lighting', 
        'cleaning': 'trash',
        'others': 'others'
      };

      setAiSuggestions({
        title: result.suggestedTitle,
        description: result.suggestedDescription,
        category: categoryMap[result.suggestedCategory] || 'others',
        priority: result.suggestedPriority,
        confidence: result.confidence,
        imageAnalysis: result.imageAnalysis
      });

      // Aplicar automaticamente as sugestões
      setSelectedCategory(categoryMap[result.suggestedCategory] || 'others');
      setSelectedUrgency(result.suggestedPriority);
      setEditableTitle(result.suggestedTitle);
      setEditableDescription(result.suggestedDescription);
      setHasUsedAI(true);

      // Avançar automaticamente para o próximo step
      setTimeout(() => {
        goToNextStep();
      }, 500);

    } catch (error) {
      console.error('Erro na análise de IA:', error);
      Alert.alert('Erro', 'Não foi possível analisar o problema. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    // Validação final antes do envio
    if (!editableDescription.trim()) {
      Alert.alert('Atenção', 'Por favor, confirme a descrição do problema.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Atenção', 'Por favor, selecione uma categoria para o problema.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Atenção', 'Por favor, selecione a localização do problema.');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mapear categoria do ReportScreen para categoria do mockData
      const mappedCategory = categoryMapping[selectedCategory] || 'others';

      // Usar título e descrição editáveis da IA
      const finalTitle = editableTitle || `${categories.find(c => c.id === selectedCategory)?.name || 'Problema'} reportado`;

      // Preparar dados do problema para criar
      const problemData = {
        title: finalTitle,
        description: editableDescription.trim(),
        category: mappedCategory,
        status: 'pending' as const,
        priority: selectedUrgency as 'low' | 'medium' | 'high',
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address || `Lat: ${selectedLocation.latitude.toFixed(6)}, Lng: ${selectedLocation.longitude.toFixed(6)}`,
        },
        images: photos.map(photo => photo.uri),
        reportedBy: user.id,
      };

      console.log('Enviando reporte:', problemData);

      // Chamar a API para criar o problema
      const response = await problemsApi.createProblem(problemData);

      if (response.success && response.data) {
        // Calcular pontos baseado na categoria e urgência
        let points = 15; // Base aumentada por usar IA
        if (selectedUrgency === 'high') points += 15;
        else if (selectedUrgency === 'medium') points += 10;
        else points += 5;
        
        if (photos.length > 0) points += 5;
        if (hasUsedAI) points += 10; // Bônus por usar IA

        // Atualizar pontos do usuário
        await useAuthStore.getState().updateUser({ 
          points: user.points + points 
        });

        // Notificar stores sobre o novo report
        problemsStore.notifyNewReport(response.data);
        statsStore.notifyNewReport(user.id);

        setIsSubmitting(false);

        Alert.alert(
          'Reporte Enviado! 🎉',
          `Obrigado por usar o Fiscaliza AI!\n\n+${points} pontos ganhos\n\nSeu reporte foi registrado com ID: ${response.data.id} e será analisado pela equipe responsável.`,
          [
            {
              text: 'Ver no Mapa',
              onPress: () => {
                resetForm();
                router.back();
              }
            },
            {
              text: 'Novo Reporte',
              onPress: () => resetForm(),
              style: 'cancel'
            }
          ]
        );
      } else {
        setIsSubmitting(false);
        Alert.alert(
          'Erro ao Enviar',
          response.error || 'Ocorreu um erro ao enviar o reporte. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Erro ao enviar reporte:', error);
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const resetForm = () => {
    setDescription('');
    setSelectedCategory(null);
    setSelectedUrgency('medium');
    setPhotos([]);
    setSelectedLocation(params.userLocation ? JSON.parse(params.userLocation as string) : null);
    setCurrentStep(0);
    setHasUsedAI(false);
    setAiSuggestions(null);
    setEditableTitle('');
    setEditableDescription('');
  };

  const getLocationText = () => {
    if (!selectedLocation) return 'Selecione a localização do problema';
    
    if (selectedLocation.address && selectedLocation.address !== 'Endereço não encontrado') {
      return selectedLocation.address;
    }
    
    return `Lat: ${selectedLocation.latitude.toFixed(6)}, Lng: ${selectedLocation.longitude.toFixed(6)}`;
  };

  // Step Content Renderers
  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <MaterialIcons name="location-on" size={32} color="#2E7D32" />
        <Text style={styles.stepTitle}>Localização do Problema</Text>
        <Text style={styles.stepDescription}>
          Selecione onde está localizado o problema que você deseja reportar
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.locationCard, !selectedLocation && styles.locationCardEmpty]}
        onPress={() => setShowMapModal(true)}
        disabled={isLoadingAddress}
      >
        <MaterialIcons name="location-on" size={24} color={selectedLocation ? "#2E7D32" : "#999"} />
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>
            {selectedLocation ? 'Local Selecionado' : 'Selecionar Local'}
          </Text>
          {isLoadingAddress ? (
            <View style={styles.loadingAddressContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color="#666" />
              <Text style={styles.loadingAddressText}>Buscando endereço...</Text>
            </View>
          ) : (
            <Text style={[styles.locationAddress, !selectedLocation && styles.locationAddressEmpty]}>
              {getLocationText()}
            </Text>
          )}
        </View>
        <MaterialIcons name="edit" size={20} color="#2E7D32" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={getCurrentLocation} 
        style={[styles.myLocationButton, isLoadingAddress && styles.myLocationButtonDisabled]}
        disabled={isLoadingAddress}
      >
        {isLoadingAddress ? (
          <>
            <MaterialIcons name="hourglass-empty" size={20} color="#999" />
            <Text style={styles.myLocationTextDisabled}>Obtendo localização...</Text>
          </>
        ) : (
          <>
            <MaterialIcons name="my-location" size={20} color="#2E7D32" />
            <Text style={styles.myLocationText}>Usar Minha Localização Atual</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // NOVO STEP: Análise com IA
  const renderAIAnalysisStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <MaterialIcons name="auto-awesome" size={32} color="#2E7D32" />
        <Text style={styles.stepTitle}>Descrição & Análise IA</Text>
        <Text style={styles.stepDescription}>
          Descreva o problema e adicione fotos. Nossa IA analisará e preencherá as informações automaticamente.
        </Text>
      </View>

      {/* Campo de Descrição */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Descrição do Problema</Text>
        <TextInput
          style={[styles.textInput, description.trim() && styles.textInputFilled]}
          placeholder="Ex: Buraco grande na pista, causando risco para veículos..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          autoFocus
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      {/* Seção de Fotos */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Fotos (Recomendado para melhor análise)</Text>
        
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <MaterialIcons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity 
          style={styles.addPhotoButton} 
          onPress={() => setShowPhotoModal(true)}
        >
          <MaterialIcons name="add-a-photo" size={24} color="#2E7D32" />
          <Text style={styles.addPhotoText}>
            {photos.length === 0 ? 'Adicionar Fotos' : 'Adicionar Mais Fotos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botão de Análise IA */}
      {description.trim().length >= 10 && (
        <TouchableOpacity
          style={[styles.aiAnalysisButton, isAnalyzing && styles.aiButtonLoading]}
          onPress={handleAIAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Animated.View style={styles.loadingSpinner}>
                <MaterialIcons name="hourglass-empty" size={24} color="#fff" />
              </Animated.View>
              <Text style={styles.aiButtonText}>Analisando com IA...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={24} color="#fff" />
              <Text style={styles.aiButtonText}>Analisar com IA ✨</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Resultado da IA */}
      {aiSuggestions && (
        <View style={styles.aiResultsContainer}>
          <View style={styles.aiResultsHeader}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.aiResultsTitle}>Análise Concluída!</Text>
          </View>
          
          <View style={styles.aiConfidenceContainer}>
            <Text style={styles.aiConfidenceText}>
              Confiança: {Math.round(aiSuggestions.confidence * 100)}%
            </Text>
            <View style={styles.aiConfidenceBar}>
              <View 
                style={[
                  styles.aiConfidenceFill, 
                  { width: `${aiSuggestions.confidence * 100}%` }
                ]} 
              />
            </View>
          </View>

          {aiSuggestions.imageAnalysis && (
            <View style={styles.imageAnalysisContainer}>
              <Text style={styles.imageAnalysisLabel}>Análise da Imagem:</Text>
              <Text style={styles.imageAnalysisText}>{aiSuggestions.imageAnalysis}</Text>
            </View>
          )}

          <Text style={styles.nextStepHint}>
            ✅ Informações aplicadas automaticamente! Avance para revisar e editar.
          </Text>
        </View>
      )}
    </View>
  );

  // NOVO STEP: Revisar e Editar
  const renderReviewEditStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <MaterialIcons name="edit" size={32} color="#2E7D32" />
        <Text style={styles.stepTitle}>Revisar & Editar</Text>
        <Text style={styles.stepDescription}>
          Revise as informações sugeridas pela IA e faça ajustes se necessário
        </Text>
      </View>

      {/* Título Editável */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Título do Reporte</Text>
        <TextInput
          style={[styles.textInput, styles.singleLineInput]}
          placeholder="Título descritivo do problema"
          value={editableTitle}
          onChangeText={setEditableTitle}
          maxLength={60}
        />
        <Text style={styles.charCount}>{editableTitle.length}/60</Text>
      </View>

      {/* Descrição Editável */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Descrição</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Descrição detalhada do problema"
          value={editableDescription}
          onChangeText={setEditableDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{editableDescription.length}/500</Text>
      </View>

      {/* Categoria Editável */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Categoria</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCardSmall,
                selectedCategory === category.id && styles.categoryCardSelected
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View style={[styles.categoryIconSmall, { backgroundColor: category.color + '20' }]}>
                <MaterialIcons name={category.icon as any} size={20} color={category.color} />
              </View>
              <Text style={[
                styles.categoryNameSmall,
                selectedCategory === category.id && styles.categoryNameSelected
              ]}>
                {category.name}
              </Text>
              {selectedCategory === category.id && (
                <View style={styles.selectedIndicatorSmall}>
                  <MaterialIcons name="check-circle" size={16} color="#2E7D32" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgência Editável */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Nível de Urgência</Text>
        <View style={styles.urgencyContainer}>
          {urgencyLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.urgencyButtonSmall,
                selectedUrgency === level.id && [styles.urgencyButtonSelected, { borderColor: level.color }]
              ]}
              onPress={() => setSelectedUrgency(level.id)}
            >
              <View style={[styles.urgencyDot, { backgroundColor: level.color }]} />
              <Text style={[
                styles.urgencyNameSmall,
                selectedUrgency === level.id && styles.urgencyNameSelected
              ]}>
                {level.name}
              </Text>
              {selectedUrgency === level.id && (
                <MaterialIcons name="radio-button-checked" size={20} color={level.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resumo das Informações */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Resumo do Reporte</Text>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.summaryText}>{getLocationText()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialIcons name="photo" size={16} color="#666" />
            <Text style={styles.summaryText}>{photos.length} foto(s)</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialIcons name="auto-awesome" size={16} color="#666" />
            <Text style={styles.summaryText}>
              Analisado pela IA ({Math.round((aiSuggestions?.confidence || 0) * 100)}% confiança)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderLocationStep();
      case 1: return renderAIAnalysisStep();
      case 2: return renderReviewEditStep();
      case 3: return (
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <MaterialIcons name="send" size={32} color="#2E7D32" />
            <Text style={styles.stepTitle}>Enviar Reporte</Text>
            <Text style={styles.stepDescription}>
              Tudo pronto! Pressione o botão para enviar seu reporte.
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.finalSubmitButton,
              (!editableTitle || !editableDescription || isSubmitting) && styles.primaryButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!editableTitle || !editableDescription || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Animated.View style={styles.loadingSpinner}>
                  <MaterialIcons name="hourglass-empty" size={24} color="white" />
                </Animated.View>
                <Text style={styles.primaryButtonText}>Enviando...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={24} color="white" />
                <Text style={styles.primaryButtonText}>Enviar Reporte</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Reportar Problema</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => Alert.alert('Ajuda', 'Siga os passos para reportar o problema de forma completa.')}
        >
          <MaterialIcons name="help-outline" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {/* Stepper Indicator */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperHeader}>
          <Text style={styles.stepCounter}>{currentStep + 1} de {steps.length}</Text>
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        </View>
        
        <View style={styles.stepperProgress}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.stepperDots}>
          {steps.map((step, index) => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepDot,
                index <= currentStep && styles.stepDotActive,
                index === currentStep && styles.stepDotCurrent
              ]}
              onPress={() => goToStep(index)}
            >
              <MaterialIcons 
                name={step.icon as any} 
                size={16} 
                color={index <= currentStep ? 'white' : '#999'} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
          {renderStepContent()}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <View style={styles.navigationContainer}>
          {canGoPrevious && (
            <TouchableOpacity 
              style={styles.navigationButton}
              onPress={goToPreviousStep}
            >
              <MaterialIcons name="arrow-back" size={20} color="#2E7D32" />
              <Text style={styles.navigationButtonText}>Anterior</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navigationSpacer} />
          
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity 
              style={[
                styles.primaryButton,
                !isCurrentStepValid && styles.primaryButtonDisabled
              ]}
              onPress={goToNextStep}
              disabled={!isCurrentStepValid}
            >
              <Text style={styles.primaryButtonText}>Próximo</Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.primaryButton,
                (!isFormValid || isSubmitting) && styles.primaryButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Animated.View style={styles.loadingSpinner}>
                    <MaterialIcons name="hourglass-empty" size={20} color="white" />
                  </Animated.View>
                  <Text style={styles.primaryButtonText}>Enviando...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Enviar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal de Mapa para Seleção de Localização */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <MaterialIcons name="close" size={24} color="#2E7D32" />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Selecionar Localização</Text>
            <TouchableOpacity onPress={confirmLocation} disabled={!selectedLocation}>
              <Text style={[
                styles.mapModalConfirm, 
                !selectedLocation && styles.mapModalConfirmDisabled
              ]}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
          
          <MapView
            style={styles.modalMap}
            region={mapRegion}
            onPress={onMapPress}
            showsUserLocation={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Localização do Problema"
                description={selectedLocation.address || "Toque no mapa para alterar a localização"}
              >
                <View style={styles.mapMarker}>
                  <MaterialIcons name="location-on" size={30} color="#F44336" />
                </View>
              </Marker>
            )}
          </MapView>
          
          <View style={styles.mapModalInstructions}>
            {isLoadingAddress ? (
              <View style={styles.mapLoadingContainer}>
                <MaterialIcons name="hourglass-empty" size={20} color="#666" />
                <Text style={styles.mapLoadingText}>Buscando endereço...</Text>
              </View>
            ) : selectedLocation ? (
              <View style={styles.mapAddressContainer}>
                <MaterialIcons name="location-on" size={20} color="#2E7D32" />
                <View style={styles.mapAddressInfo}>
                  <Text style={styles.mapAddressTitle}>Local Selecionado:</Text>
                  <Text style={styles.mapAddressText}>
                    {selectedLocation.address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.mapInstructionText}>
                Toque no mapa para selecionar a localização exata do problema
              </Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Foto */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Foto</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <MaterialIcons name="camera-alt" size={24} color="#2E7D32" />
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={24} color="#2E7D32" />
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancel} 
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  headerAction: {
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stepperContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepperProgress: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
  stepperDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#2E7D32',
  },
  stepDotCurrent: {
    backgroundColor: '#4CAF50',
    transform: [{ scale: 1.1 }],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  locationCardEmpty: {
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  locationAddressEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  myLocationButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  myLocationText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    minHeight: 120,
    textAlignVertical: 'top',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
  },
  textInputFilled: {
    borderColor: '#2E7D32',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryCardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E8',
  },
  categoryIcon: {
    borderRadius: 30,
    padding: 16,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  urgencyContainer: {
    gap: 12,
  },
  urgencyButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  urgencyButtonSelected: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
  },
  urgencyDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
  },
  urgencyInfo: {
    flex: 1,
  },
  urgencyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  urgencyNameSelected: {
    fontWeight: '600',
  },
  urgencyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  photosContainer: {
    marginBottom: 16,
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#2E7D32',
    marginTop: 8,
    fontWeight: '500',
  },
  reviewContainer: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  navigationButtonText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  navigationSpacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSpinner: {
    transform: [{ rotate: '45deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalCancel: {
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  mapModalConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  mapModalConfirmDisabled: {
    color: '#999',
  },
  modalMap: {
    flex: 1,
  },
  mapMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapModalInstructions: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapInstructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  aiButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonLoading: {
    backgroundColor: '#BDBDBD',
  },
  aiButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  singleLineInput: {
    minHeight: 50,
    maxHeight: 50,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 100,
  },
  aiAnalysisButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  aiResultsContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  aiResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  aiConfidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiConfidenceBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    flex: 1,
  },
  aiConfidenceFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
  aiConfidenceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  imageAnalysisContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  imageAnalysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  imageAnalysisText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  nextStepHint: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryCardSmall: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: (width - 80) / 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryIconSmall: {
    borderRadius: 20,
    padding: 8,
    marginBottom: 6,
  },
  categoryNameSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedIndicatorSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  urgencyButtonSmall: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 8,
  },
  urgencyNameSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  finalSubmitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingAddressText: {
    fontSize: 14,
    color: '#666',
  },
  myLocationButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  myLocationTextDisabled: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  mapLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  mapAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapAddressInfo: {
    flex: 1,
  },
  mapAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mapAddressText: {
    fontSize: 14,
    color: '#666',
  },
}); 