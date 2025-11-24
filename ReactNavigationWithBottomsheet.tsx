import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform, UIManager } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useFocusEffect, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  Settings, Layers, Plus, Minus, MapPin, Navigation, Edit3, ArrowLeft, ArrowRight, List, CheckSquare, FileText, Satellite, Map as MapIcon 
} from 'lucide-react-native';

// --- SETUP ---
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Stack = createNativeStackNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- MOCK DATEN & HELPER ---
const DUMMY_DATA = [
  {
    id: 1, title: "KVz 8203 Berlin", lat: 52.5200, lon: 13.4050, status: "Aktiv", date: "24.07.2025",
    address: { street: "Alexanderplatz 1", zip: "10178", city: "Berlin" },
    belegung: [{ id: 1, port: "01", type: "Glasfaser", status: "Belegt" }],
    tasks: ["Gehäuse reinigen", "Filter wechseln"]
  }
];

// --- SCREENS ---

// 1. Visitenkarte Screen
const CardScreen = ({ bottomSheetRef }) => {
  const navigation = useNavigation();
  const item = DUMMY_DATA[0]; // Vereinfacht: Immer Item 1

  // TRICK: Wenn dieser Screen Fokus bekommt -> Sheet auf "Mittel" (Index 1) setzen
  useFocusEffect(
    React.useCallback(() => {
      bottomSheetRef.current?.snapToIndex(0); // 0 = 45% (siehe snapPoints unten)
    }, [])
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>Wartung: {item.date}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Options')}>
          <Edit3 color="#475569" size={20} />
        </TouchableOpacity>
      </View>
      {/* ... Rest der Karte ... */}
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );
};

// 2. Options Screen
const OptionsScreen = ({ bottomSheetRef }) => {
  const navigation = useNavigation();

  // TRICK: Wenn dieser Screen Fokus bekommt -> Sheet auf "Mittel" lassen
  useFocusEffect(
    React.useCallback(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, [])
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#334155" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Optionen</Text>
      </View>
      <View style={{ gap: 12 }}>
        <OptionItem icon={<FileText size={20} color="blue"/>} label="Kopfdaten" onPress={() => navigation.navigate('DetailsHead')} />
        <OptionItem icon={<CheckSquare size={20} color="green"/>} label="Tasks" onPress={() => navigation.navigate('DetailsTasks')} />
      </View>
    </View>
  );
};

// 3. Detail Screen (Groß)
const DetailTaskScreen = ({ bottomSheetRef }) => {
  const navigation = useNavigation();

  // TRICK: Hier brauchen wir Platz -> Sheet auf "Groß" (Index 1) setzen
  useFocusEffect(
    React.useCallback(() => {
      bottomSheetRef.current?.snapToIndex(1); // 1 = 90%
    }, [])
  );

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#334155" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
      </View>
      
      {/* SHORTCUT ZU KOPFDATEN */}
      <View style={styles.shortcutContainer}>
          <Text style={styles.shortcutTitle}>Daten falsch?</Text>
          <TouchableOpacity 
            style={styles.shortcutBtn}
            // React Navigation push: Schiebt neuen Screen auf den Stack
            onPress={() => navigation.navigate('DetailsHead')} 
          >
            <Text style={styles.shortcutBtnText}>Ändern</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
       </View>

      <BottomSheetScrollView>
        {DUMMY_DATA[0].tasks.map((t, i) => (
           <Text key={i} style={styles.listItem}>{t}</Text>
        ))}
      </BottomSheetScrollView>
    </View>
  );
};

const DetailHeadScreen = ({ bottomSheetRef }) => {
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      bottomSheetRef.current?.snapToIndex(1); // Groß
    }, [])
  );

  return (
    <View style={styles.screenContainer}>
       <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#334155" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kopfdaten</Text>
      </View>
      <Text>Hier stehen die Formulardaten...</Text>
    </View>
  )
}


// --- MAIN APP ---

export default function App() {
  const bottomSheetRef = useRef(null);
  
  // WICHTIG: SnapPoints definieren.
  // 0: 45% (Mittel - für Karte & Optionen)
  // 1: 90% (Groß - für Listen)
  const snapPoints = useMemo(() => ['45%', '90%'], []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        
        {/* MAP HINTERGRUND */}
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{ latitude: 52.52, longitude: 13.405, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        >
          <Marker coordinate={{ latitude: 52.52, longitude: 13.405 }} />
        </MapView>

        {/* BOTTOM SHEET MIT REACT NAVIGATION */}
        <BottomSheet
          ref={bottomSheetRef}
          index={0} // Startet bei 45%
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          backgroundStyle={styles.sheetBackground}
        >
          {/* Der NavigationContainer muss das Sheet umschließen oder darin liegen.
              Da wir nur IM Sheet navigieren wollen, liegt er HIER DRIN.
              Wichtig: 'independent={true}' nutzen, falls die App schon einen Router hat.
          */}
          <NavigationContainer independent={true}>
            <Stack.Navigator 
              screenOptions={{ 
                headerShown: false,
                contentStyle: { backgroundColor: 'white' }, // Hintergrund weiß
                animation: 'slide_from_right' // Native iOS Animation
              }}
            >
              
              {/* Wir übergeben die `bottomSheetRef` als Prop an die Screens */}
              <Stack.Screen name="Card">
                {props => <CardScreen {...props} bottomSheetRef={bottomSheetRef} />}
              </Stack.Screen>

              <Stack.Screen name="Options">
                {props => <OptionsScreen {...props} bottomSheetRef={bottomSheetRef} />}
              </Stack.Screen>

              <Stack.Screen name="DetailsTasks">
                 {props => <DetailTaskScreen {...props} bottomSheetRef={bottomSheetRef} />}
              </Stack.Screen>

              <Stack.Screen name="DetailsHead">
                 {props => <DetailHeadScreen {...props} bottomSheetRef={bottomSheetRef} />}
              </Stack.Screen>

            </Stack.Navigator>
          </NavigationContainer>

        </BottomSheet>

      </View>
    </GestureHandlerRootView>
  );
}

// --- MINIMAL STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  sheetBackground: { borderRadius: 24, elevation: 10 },
  screenContainer: { flex: 1, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardSubtitle: { color: 'gray' },
  iconBtn: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 20 },
  statusBadge: { marginTop: 10, backgroundColor: '#dcfce7', padding: 5, borderRadius: 5, alignSelf: 'flex-start' },
  statusText: { color: '#166534', fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  // Helper Item Styles
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginBottom: 8 },
  listItem: { padding: 15, backgroundColor: '#f8fafc', marginBottom: 8, borderRadius: 8 },
  
  // Shortcut
  shortcutContainer: { flexDirection: 'row', backgroundColor: '#fff7ed', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  shortcutTitle: { color: '#9a3412', fontWeight: 'bold' },
  shortcutBtn: { flexDirection: 'row', backgroundColor: '#ea580c', padding: 8, borderRadius: 6, alignItems: 'center' },
  shortcutBtnText: { color: 'white', marginRight: 5, fontWeight: '600' }
});

// Helper Component für die Datei-Übersichtlichkeit
const OptionItem = ({ icon, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.optionItem}>
    <View style={{ marginRight: 10 }}>{icon}</View>
    <Text style={{ flex: 1, fontWeight: '500' }}>{label}</Text>
    <ArrowRight size={20} color="#cbd5e1" />
  </TouchableOpacity>
);

