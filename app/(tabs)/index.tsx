import { Problem } from "@/data/mockData";
import { useAuthStore } from "@/stores/authStore";
import { useProblemsStore } from "@/stores/problemsStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  BounceIn,
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  try {
    const ReactNativeMaps = require("react-native-maps");
    MapView = ReactNativeMaps?.default ?? null;
    Marker = ReactNativeMaps?.Marker ?? null;
  } catch (error) {
    console.warn("Mapa não disponível nesta plataforma:", error);
  }
}

const shouldRenderMap = Platform.OS !== "web" && !!MapView && !!Marker;

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const getIconName = (category: string) => {
  switch (category) {
    case "road":
      return "construction";
    case "lighting":
      return "lightbulb-outline";
    case "cleaning":
      return "delete";
    case "others":
      return "report-problem";
    default:
      return "report-problem";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "resolved":
      return "#4CAF50";
    case "in_progress":
      return "#FF9800";
    case "pending":
      return "#F44336";
    default:
      return "#666";
  }
};

const filterOptions = [
  { id: "all", name: "Todos", icon: "view-module", color: "#2E7D32" },
  { id: "pending", name: "Pendentes", icon: "schedule", color: "#F44336" },
  {
    id: "in_progress",
    name: "Em Andamento",
    icon: "autorenew",
    color: "#FF9800",
  },
  {
    id: "resolved",
    name: "Resolvidos",
    icon: "check-circle",
    color: "#4CAF50",
  },
  { id: "road", name: "Vias", icon: "construction", color: "#F44336" },
  {
    id: "lighting",
    name: "Iluminação",
    icon: "lightbulb-outline",
    color: "#FF9800",
  },
  { id: "cleaning", name: "Limpeza", icon: "delete", color: "#9C27B0" },
];

const AnimatedFilter = ({
  filter,
  isSelected,
  onPress,
}: {
  filter: any;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(isSelected ? 1 : 0.95);
  const opacity = useSharedValue(isSelected ? 1 : 0.7);

  React.useEffect(() => {
    scale.value = withSpring(isSelected ? 1 : 0.95, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(isSelected ? 1 : 0.7, {
      duration: 200,
    });
  }, [isSelected, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          isSelected && [
            styles.filterChipSelected,
            { backgroundColor: filter.color + "20", borderColor: filter.color },
          ],
        ]}
        onPress={onPress}
      >
        <MaterialIcons
          name={filter.icon}
          size={16}
          color={isSelected ? filter.color : "#666"}
        />
        <Text
          style={[
            styles.filterText,
            isSelected && { color: filter.color, fontWeight: "600" },
          ]}
        >
          {filter.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Index() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Usar store para dados centralizados
  const { problems, isLoading: loading, lastUpdated, loadProblems } = useProblemsStore();

  // Região padrão do RJ (zoom out para mostrar toda a cidade) - useMemo para estabilizar
  const defaultRJRegion = useMemo(() => ({
    latitude: -22.9068,  
    longitude: -43.1729,
    latitudeDelta: 0.3,   // Zoom out maior para mostrar todo o RJ
    longitudeDelta: 0.3,
  }), []);

  const [region, setRegion] = useState(defaultRJRegion);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [currentNeighborhood, setCurrentNeighborhood] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [hasCalculatedInitialRegion, setHasCalculatedInitialRegion] = useState(false);
  const [mapContext, setMapContext] = useState("Carregando...");
  const [visibleProblemsCount, setVisibleProblemsCount] = useState(0);

  const filterOpacity = useSharedValue(0);
  const filterTranslateY = useSharedValue(-20);

  // Função para calcular distância entre dois pontos - useCallback para estabilizar
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  }, []);

  // Função para encontrar problemas próximos ao usuário
  const findNearbyProblems = useCallback((userLat: number, userLng: number, problems: Problem[], maxDistance = 5) => {
    return problems.filter(problem => {
      const distance = calculateDistance(
        userLat, userLng,
        problem.location.latitude, problem.location.longitude
      );
      return distance <= maxDistance;
    });
  }, [calculateDistance]);

  // Função para calcular região que engloba problemas próximos
  const calculateRegionForProblems = useCallback((userLat: number, userLng: number, nearbyProblems: Problem[]) => {
    if (nearbyProblems.length === 0) {
      // Se não há problemas próximos, focar na localização do usuário
      return {
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    // Incluir a localização do usuário no cálculo
    const allLats = [userLat, ...nearbyProblems.map(p => p.location.latitude)];
    const allLngs = [userLng, ...nearbyProblems.map(p => p.location.longitude)];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calcular deltas com margem para visualização
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.min(latDelta, 0.1), // Limitar zoom máximo
      longitudeDelta: Math.min(lngDelta, 0.1),
    };
  }, []);

  // Função para calcular a melhor região inicial
  const calculateIntelligentRegion = useCallback((userLat: number, userLng: number, allProblems: Problem[]) => {
    console.log(`🗺️ Calculando região inteligente para usuário em ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`);
    
    // Primeiro, tentar encontrar problemas num raio de 5km
    let nearbyProblems = findNearbyProblems(userLat, userLng, allProblems, 5);
    console.log(`📍 Encontrados ${nearbyProblems.length} problemas num raio de 5km`);

    if (nearbyProblems.length >= 3) {
      // Se há pelo menos 3 problemas próximos, focar nessa área
      const region = calculateRegionForProblems(userLat, userLng, nearbyProblems);
      console.log(`✅ Focando em área com problemas próximos`);
      setMapContext(`Área próxima • ${nearbyProblems.length} problemas`);
      return region;
    }

    // Se não há problemas suficientes em 5km, tentar 10km
    nearbyProblems = findNearbyProblems(userLat, userLng, allProblems, 10);
    console.log(`📍 Expandindo busca: ${nearbyProblems.length} problemas num raio de 10km`);

    if (nearbyProblems.length >= 2) {
      const region = calculateRegionForProblems(userLat, userLng, nearbyProblems);
      console.log(`✅ Focando em área expandida com problemas próximos`);
      setMapContext(`Região próxima • ${nearbyProblems.length} problemas`);
      return region;
    }

    // Se ainda não há problemas suficientes, verificar se há problemas na cidade
    const cityProblems = allProblems.filter(problem => {
      const distance = calculateDistance(
        userLat, userLng,
        problem.location.latitude, problem.location.longitude
      );
      return distance <= 50; // 50km - área metropolitana
    });

    if (cityProblems.length === 0) {
      // Se não há problemas na região, mostrar todo o RJ
      console.log(`🌎 Nenhum problema na região, mostrando todo o RJ`);
      setMapContext(`Rio de Janeiro • ${allProblems.length} problemas`);
      return defaultRJRegion;
    }

    // Se há alguns problemas na cidade, focar na localização do usuário com zoom médio
    console.log(`📍 Focando na localização do usuário com zoom médio`);
    setMapContext(`Sua região • ${cityProblems.length} problemas`);
    return {
      latitude: userLat,
      longitude: userLng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [findNearbyProblems, calculateRegionForProblems, calculateDistance, defaultRJRegion]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Só recarregar quando lastUpdated indica um novo report
  useEffect(() => {
    if (lastUpdated > 0) {
      loadProblems();
    }
  }, [lastUpdated, loadProblems]);

  // Calcular região inteligente quando temos localização do usuário e problemas carregados
  useEffect(() => {
    if (userLocation && problems.length > 0 && !hasCalculatedInitialRegion && !loading) {
      console.log(`🎯 Iniciando cálculo de região inteligente...`);
      const intelligentRegion = calculateIntelligentRegion(
        userLocation.latitude, 
        userLocation.longitude, 
        problems
      );
      setRegion(intelligentRegion);
      setHasCalculatedInitialRegion(true);
      console.log(`✅ Região inteligente calculada e aplicada`);
    }
  }, [userLocation, problems, hasCalculatedInitialRegion, loading, calculateIntelligentRegion]);

  // Definir contexto quando há problemas mas não há localização do usuário
  useEffect(() => {
    if (!userLocation && problems.length > 0 && !loading) {
      setMapContext(`Rio de Janeiro • ${problems.length} problemas`);
    }
  }, [userLocation, problems, loading]);

  useEffect(() => {
    let filtered = problems;

    if (selectedFilter !== "all") {
      if (["pending", "in_progress", "resolved"].includes(selectedFilter)) {
        filtered = problems.filter((p) => p.status === selectedFilter);
      } else {
        filtered = problems.filter((p) => p.category === selectedFilter);
      }
    }

    setFilteredProblems(filtered);
    
    // Atualizar contexto do mapa quando filtros mudam
    if (hasCalculatedInitialRegion && userLocation) {
      if (selectedFilter === "all") {
        // Recalcular contexto para todos os problemas
        const nearbyProblems = findNearbyProblems(userLocation.latitude, userLocation.longitude, problems, 10);
        if (nearbyProblems.length >= 2) {
          setMapContext(`Região próxima • ${filtered.length} problemas`);
        } else if (problems.length > 0) {
          setMapContext(`Rio de Janeiro • ${filtered.length} problemas`);
        }
      } else {
        // Mostrar contexto do filtro aplicado
        const filterName = filterOptions.find(f => f.id === selectedFilter)?.name || 'Filtrados';
        setMapContext(`${filterName} • ${filtered.length} problemas`);
      }
    }
  }, [selectedFilter, problems, hasCalculatedInitialRegion, userLocation, findNearbyProblems]);

  useEffect(() => {
    filterOpacity.value = withTiming(showFilters ? 1 : 0, { duration: 300 });
    filterTranslateY.value = withSpring(showFilters ? 0 : -20, {
      damping: 15,
      stiffness: 150,
    });
  }, [showFilters, filterOpacity, filterTranslateY]);

  const getNeighborhoodFromLocation = useCallback(async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        // Priorizar district (bairro), depois city, depois region
        const neighborhood =
          location.district ||
          location.city ||
          location.region ||
          "Localização Atual";
        setCurrentNeighborhood(neighborhood);
      }
    } catch (error) {
      console.log("Erro ao obter bairro:", error);
      // Manter o valor padrão se houver erro
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    setLocationLoading(true);
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 10,
    })
      .then(async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // Só ajustar região se ainda não calculamos a região inteligente
        // ou se não há problemas carregados para considerar
        if (!hasCalculatedInitialRegion || problems.length === 0) {
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }

        // Obter o bairro baseado na localização
        await getNeighborhoodFromLocation(latitude, longitude);
      })
      .catch((error) => {
        Alert.alert("Erro", "Não foi possível obter sua localização");
        console.log(error);
      })
      .finally(() => {
        setLocationLoading(false);
      });
  }, [hasCalculatedInitialRegion, problems, getNeighborhoodFromLocation]);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
    transform: [{ translateY: filterTranslateY.value }],
  }));

  // Função para calcular se um problema está visível na região atual do mapa
  const isProblemInViewport = (problem: Problem, currentRegion: any) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = currentRegion;
    
    const northBound = latitude + latitudeDelta / 2;
    const southBound = latitude - latitudeDelta / 2;
    const eastBound = longitude + longitudeDelta / 2;
    const westBound = longitude - longitudeDelta / 2;
    
    return (
      problem.location.latitude <= northBound &&
      problem.location.latitude >= southBound &&
      problem.location.longitude <= eastBound &&
      problem.location.longitude >= westBound
    );
  };

  // Função para calcular problemas visíveis no viewport atual
  const updateVisibleProblemsCount = useCallback((currentRegion: any, currentProblems: Problem[]) => {
    const visibleProblems = currentProblems.filter(problem => 
      isProblemInViewport(problem, currentRegion)
    );
    setVisibleProblemsCount(visibleProblems.length);
    return visibleProblems.length;
  }, []);

  // Função para centralizar na localização do usuário
  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      setMapContext(`Sua localização • ${updateVisibleProblemsCount(newRegion, filteredProblems)} problemas`);
    } else {
      // Se não tem localização, solicitar
      getCurrentLocation();
    }
  }, [userLocation, filteredProblems, updateVisibleProblemsCount, getCurrentLocation]);

  // Atualizar contagem de problemas visíveis quando filtros ou região mudam
  useEffect(() => {
    if (filteredProblems.length > 0) {
      updateVisibleProblemsCount(region, filteredProblems);
    }
  }, [filteredProblems, region, updateVisibleProblemsCount]);

  // Função para capturar mudanças na região do mapa (quando usuário navega/faz zoom)
  const onRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    updateVisibleProblemsCount(newRegion, filteredProblems);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com informações integradas */}
      <Animated.View entering={SlideInUp.delay(100)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {currentNeighborhood || mapContext}
            </Text>
            {locationLoading && (
              <Animated.View
                entering={FadeIn}
                style={styles.locationLoadingIndicator}
              >
                <MaterialIcons
                  name="location-searching"
                  size={16}
                  color="#FF9800"
                />
              </Animated.View>
            )}
          </View>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>
              {visibleProblemsCount > 0 
                ? `${visibleProblemsCount} problema(s) visível(is) • ${filteredProblems.length} total`
                : currentNeighborhood ? mapContext : `${filteredProblems.length} problema(s) no mapa`
              }
            </Text>
            {selectedFilter !== 'all' && (
              <View style={styles.filterIndicator}>
                <MaterialIcons name="filter-list" size={14} color="#2E7D32" />
                <Text style={styles.filterIndicatorText}>
                  {filterOptions.find(f => f.id === selectedFilter)?.name}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              showFilters && styles.headerButtonActive,
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons
              name="tune"
              size={24}
              color={showFilters ? "#2E7D32" : "#666"}
            />
            {selectedFilter !== 'all' && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
          
          {/* Botão Região Inteligente */}
          {userLocation && problems.length > 0 && (
            <TouchableOpacity
              style={[
                styles.headerButton,
                hasCalculatedInitialRegion && styles.headerButtonSmart
              ]}
              onPress={() => {
                if (userLocation) {
                  const intelligentRegion = calculateIntelligentRegion(
                    userLocation.latitude, 
                    userLocation.longitude, 
                    problems
                  );
                  setRegion(intelligentRegion);
                  updateVisibleProblemsCount(intelligentRegion, filteredProblems);
                }
              }}
            >
              <MaterialIcons 
                name="auto-awesome" 
                size={24} 
                color={hasCalculatedInitialRegion ? "#2E7D32" : "#666"} 
              />
            </TouchableOpacity>
          )}
          
          {/* Botão Minha Localização */}
          <TouchableOpacity
            style={[
              styles.headerButton,
              userLocation && styles.headerButtonActive
            ]}
            onPress={centerOnUserLocation}
          >
            <MaterialIcons 
              name="my-location" 
              size={24} 
              color={userLocation ? "#2E7D32" : "#666"} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Filtros Animados */}
      {showFilters && (
        <Animated.View style={[styles.filtersContainer, filterAnimatedStyle]}>
          <Text style={styles.filtersTitle}>Filtrar por:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {filterOptions.map((filter, index) => (
              <Animated.View
                key={filter.id}
                entering={FadeIn.delay(index * 50)}
              >
                <AnimatedFilter
                  filter={filter}
                  isSelected={selectedFilter === filter.id}
                  onPress={() => setSelectedFilter(filter.id)}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Mapa */}
      {shouldRenderMap ? (
        <Animated.View entering={FadeIn.delay(300)} style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={false}
            mapType="standard"
            userLocationPriority="high"
          >
            {!loading &&
              filteredProblems.map((problem, index) => (
                <Marker
                  key={problem.id}
                  coordinate={{
                    latitude: problem.location.latitude,
                    longitude: problem.location.longitude,
                  }}
                  onPress={() => {
                    setSelectedProblem(problem);
                  }}
                >
                  <Animated.View
                    entering={BounceIn.delay(index * 50)}
                    style={styles.markerContainer}
                  >
                    <View
                      style={[
                        styles.markerPin,
                        { backgroundColor: getStatusColor(problem.status) },
                      ]}
                    >
                      <MaterialIcons
                        name={getIconName(problem.category)}
                        size={16}
                        color="white"
                      />
                    </View>

                    {problem.priority === "high" && (
                      <View style={styles.priorityIndicator} />
                    )}

                    {user && problem.reportedBy === user.id && (
                      <View style={styles.userIndicator}>
                        <MaterialIcons name="star" size={8} color="#FFD700" />
                      </View>
                    )}
                  </Animated.View>
                </Marker>
              ))}
          </MapView>

          {loading && (
            <Animated.View entering={FadeIn} style={styles.loadingOverlay}>
              <MaterialIcons name="hourglass-empty" size={32} color="#2E7D32" />
              <Text style={styles.loadingText}>Carregando problemas...</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeIn.delay(500)} style={styles.mapStatusIndicator}>
            <View style={styles.statusDots}>
              <View style={styles.statusDotContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.statusDotLabel}>Pendente</Text>
              </View>
              <View style={styles.statusDotContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.statusDotLabel}>Em andamento</Text>
              </View>
              <View style={styles.statusDotContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.statusDotLabel}>Resolvido</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.delay(300)} style={styles.mapContainer}>
          <View style={styles.webMapFallback}>
            <MaterialIcons name="map" size={36} color="#2E7D32" />
            <Text style={styles.webMapFallbackTitle}>Mapa indisponível na web</Text>
            <Text style={styles.webMapFallbackText}>
              Este recurso requer a plataforma nativa para exibir o mapa interativo.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Callout melhorado no mapa */}
      {selectedProblem && (
        <Animated.View entering={FadeIn} style={styles.mapCallout}>
          <TouchableOpacity
            onPress={() => setSelectedProblem(null)}
            style={styles.calloutClose}
          >
            <MaterialIcons name="close" size={18} color="#666" />
          </TouchableOpacity>

          {/* Imagem em destaque */}
          {selectedProblem.images && selectedProblem.images.length > 0 && (
            <View style={styles.calloutImageContainer}>
              <Image
                source={{ uri: selectedProblem.images[0] }}
                style={styles.calloutImage}
                resizeMode="cover"
              />
              <View style={styles.calloutImageOverlay}>
                <View
                  style={[
                    styles.calloutStatusBadge,
                    { backgroundColor: getStatusColor(selectedProblem.status) },
                  ]}
                >
                  <MaterialIcons
                    name={
                      selectedProblem.status === "resolved"
                        ? "check"
                        : selectedProblem.status === "in_progress"
                        ? "autorenew"
                        : "schedule"
                    }
                    size={12}
                    color="white"
                  />
                  <Text style={styles.calloutStatusText}>
                    {selectedProblem.status === "resolved"
                      ? "Resolvido"
                      : selectedProblem.status === "in_progress"
                      ? "Em Andamento"
                      : "Pendente"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.calloutContent}>
            {/* Cabeçalho com categoria e prioridade */}
            <View style={styles.calloutHeader}>
              <View style={styles.calloutCategory}>
                <MaterialIcons
                  name={getIconName(selectedProblem.category)}
                  size={16}
                  color="#2E7D32"
                />
                <Text style={styles.calloutCategoryText}>
                  {selectedProblem.category === "road" ? "Vias" :
                   selectedProblem.category === "lighting" ? "Iluminação" :
                   selectedProblem.category === "cleaning" ? "Limpeza" : "Outros"}
                </Text>
              </View>
              {selectedProblem.priority === "high" && (
                <View style={styles.calloutPriority}>
                  <MaterialIcons name="priority-high" size={14} color="#FF5722" />
                  <Text style={styles.calloutPriorityText}>Alta</Text>
                </View>
              )}
            </View>

            {/* Título */}
            <Text style={styles.calloutTitle} numberOfLines={2}>
              {selectedProblem.title}
            </Text>

            {/* Informações do usuário */}
            <View style={styles.calloutUser}>
              <MaterialIcons name="person" size={16} color="#666" />
              <Text style={styles.calloutUserText}>
                Reportado por {selectedProblem.reportedBy === user?.id ? "Você" : `Usuário ${selectedProblem.reportedBy.slice(-4)}`}
              </Text>
              <Text style={styles.calloutDate}>
                • {new Date(selectedProblem.reportedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>

            {/* Descrição breve */}
            {selectedProblem.description && (
              <Text style={styles.calloutDescription} numberOfLines={2}>
                {selectedProblem.description}
              </Text>
            )}

            {/* Localização */}
            <View style={styles.calloutLocation}>
              <MaterialIcons name="location-on" size={14} color="#666" />
              <Text style={styles.calloutLocationText} numberOfLines={1}>
                {selectedProblem.location.address || "Localização no mapa"}
              </Text>
            </View>

            {/* Métricas e ações */}
            <View style={styles.calloutFooter}>
              <View style={styles.calloutMeta}>
                <View style={styles.calloutMetaItem}>
                  <MaterialIcons name="thumb-up" size={16} color="#4CAF50" />
                  <Text style={styles.calloutMetaText}>
                    {selectedProblem.votes}
                  </Text>
                </View>
                <View style={styles.calloutMetaItem}>
                  <MaterialIcons name="comment" size={16} color="#2196F3" />
                  <Text style={styles.calloutMetaText}>
                    {selectedProblem.comments.length}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.calloutButton}
                onPress={() => {
                  router.push({
                    pathname: "/ProblemDetailsScreen",
                    params: { problemId: selectedProblem.id },
                  });
                }}
              >
                <Text style={styles.calloutButtonText}>Ver Detalhes</Text>
                <MaterialIcons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Botão Flutuante Animado */}
      <Animated.View entering={BounceIn.delay(800)} style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() =>
            router.push({
              pathname: "/ReportScreen",
              params: {
                initialRegion: JSON.stringify(region),
                userLocation: userLocation
                  ? JSON.stringify(userLocation)
                  : null,
              },
            })
          }
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  headerButtonActive: {
    backgroundColor: "#E8F5E8",
  },
  headerButtonSmart: {
    backgroundColor: "#E8F5E8",
  },
  filtersContainer: {
    backgroundColor: "white",
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
    marginRight: 8,
  },
  filterChipSelected: {
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  // Legenda removida - informações integradas no header e indicadores no mapa
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  map: {
    flex: 1,
  },
  webMapFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F8F4",
    padding: 24,
  },
  webMapFallbackTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
  },
  webMapFallbackText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  markerPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  priorityIndicator: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5722",
    borderWidth: 1,
    borderColor: "#fff",
  },
  userIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  fabButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  mapCallout: {
    position: "absolute",
    bottom: 120,
    left: 40,
    right: 40,
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: "hidden",
    maxHeight: 400,
  },
  calloutClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutImageContainer: {
    position: "relative",
    height: 120,
    backgroundColor: "#F5F5F5",
  },
  calloutImage: {
    width: "100%",
    height: "100%",
  },
  calloutImageOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  calloutContent: {
    padding: 16,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calloutCategory: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  calloutCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  calloutPriority: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  calloutPriorityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FF5722",
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  calloutUser: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  calloutUserText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  calloutDate: {
    fontSize: 12,
    color: "#999",
  },
  calloutDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 10,
  },
  calloutLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  calloutLocationText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  calloutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calloutStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  calloutStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  calloutMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  calloutMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  calloutMetaText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  calloutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationLoadingIndicator: {
    marginLeft: 4,
  },
  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    backgroundColor: "#E8F5E8",
    borderRadius: 12,
  },
  filterIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#F44336",
    borderRadius: 6,
    width: 12,
    height: 12,
  },
  mapStatusIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    elevation: 4,
  },
  statusDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDotContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  statusDotLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
  },
});
