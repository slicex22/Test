import React, { useCallback, useMemo, useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Platform, 
  LayoutAnimation, 
  UIManager,
  FlatList 
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView, BottomSheetView, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  Settings, 
  Layers, 
  Plus, 
  Minus, 
  MapPin, 
  Navigation, 
  Edit3, 
  ArrowLeft, 
  ArrowRight, // Neu importiert
  List, 
  CheckSquare, 
  FileText,
  Satellite,
  Map as MapIcon 
} from 'lucide-react-native';

// Aktiviert LayoutAnimations für Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- MOCK DATEN ---
const DUMMY_DATA = [
  {
    id: 1,
    title: "KVz 8203 Berlin",
    lat: 52.5200,
    lon: 13.4050,
    status: "Aktiv",
    date: "24.07.2025",
    address: { street: "Alexanderplatz 1", zip: "10178", city: "Berlin" },
    belegung: [
      { id: 1, port: "01", type: "Glasfaser", status: "Belegt" },
      { id: 2, port: "02", type: "Kupfer", status: "Frei" },
      { id: 3, port: "03", type: "Glasfaser", status: "Defekt" },
    ],
    tasks: ["Gehäuse reinigen", "Filter wechseln"]
  },
  {
    id: 2,
    title: "KVz 4099 München",
    lat: 48.1351,
    lon: 11.5820,
    status: "Wartung",
    date: "01.08.2025",
    address: { street: "Marienplatz 2", zip: "80331", city: "München" },
    belegung: [],
    tasks: ["Austausch"]
  },
  {
    id: 3,
    title: "KVz 1022 Hamburg",
    lat: 53.5511,
    lon: 9.9937,
    status: "Aktiv",
    date: "15.08.2025",
    address: { street: "Reeperbahn 5", zip: "20359", city: "Hamburg" },
    belegung: [{ id: 1, port: "01", type: "Kupfer", status: "Belegt" }],
    tasks: ["Prüfung"]
  }
];

// --- APP COMPONENT ---

export default function App() {
  // --- STATE ---
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [mapType, setMapType] = useState("standard");
  const [mapOptionsOpen, setMapOptionsOpen] = useState(false);
  const [sheetView, setSheetView] = useState('card'); 

  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  // Snap Points
  const snapPoints = useMemo(() => ['15%', '45%', '90%'], []);

  // Helper
  const selectedPinData = DUMMY_DATA.find(p => p.id === selectedPinId);

  // --- HANDLERS ---

  const handlePinPress = (id: number) => {
    setSelectedPinId(id);
    setSheetView('card');
    bottomSheetRef.current?.snapToIndex(1); 

    const index = DUMMY_DATA.findIndex(p => p.id === id);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newItem = viewableItems[0].item;
      setSelectedPinId(prev => (prev !== newItem.id ? newItem.id : prev));
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50 
  }).current;


  const toggleMapOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMapOptionsOpen(!mapOptionsOpen);
  };

  const navigateTo = (view, snapIndex = 2) => {
    setSheetView(view);
    bottomSheetRef.current?.snapToIndex(snapIndex);
  };

  const handleBack = () => {
    // Einfache Back-Logik: Details -> Options -> Card
    if (sheetView.startsWith('details_')) {
      navigateTo('options', 2);
    } else if (sheetView === 'options') {
      navigateTo('card', 1);
    }
  };

  // --- RENDER ITEMS ---

  const renderCardItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>Wartung: {item.date}</Text>
          </View>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => navigateTo('options', 1)}
          >
            <Edit3 color="#475569" size={20} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'Aktiv' ? '#22c55e' : '#f59e0b' }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>

        <View style={styles.addressBox}>
           <Text style={styles.addressText}>{item.address.street}</Text>
           <Text style={styles.addressText}>{item.address.zip} {item.address.city}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Navigieren</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <MapPin color="#475569" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOptions = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft color="#334155" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Optionen</Text>
      </View>
      
      <Text style={styles.contextLabel}>Für: {selectedPinData?.title}</Text>

      <View style={styles.optionsList}>
        <OptionItem 
          icon={<FileText color="#3b82f6" size={24} />} 
          label="Kopfdaten" 
          onPress={() => navigateTo('details_head')} 
        />
        <OptionItem 
          icon={<List color="#a855f7" size={24} />} 
          label="Belegungsliste" 
          onPress={() => navigateTo('details_assign')} 
        />
        <OptionItem 
          icon={<CheckSquare color="#10b981" size={24} />} 
          label="Task Liste" 
          onPress={() => navigateTo('details_task')} 
        />
      </View>
    </View>
  );

  const renderDetails = () => {
    let content = null;
    let title = "";
    const data = selectedPinData;

    if (!data) return null;

    if (sheetView === 'details_head') {
      title = "Kopfdaten";
      content = (
        <View style={styles.detailBlock}>
          <Text style={styles.label}>Adresse</Text>
          <Text style={styles.value}>{data.address.street}</Text>
          <Text style={styles.value}>{data.address.zip} {data.address.city}</Text>
          <Text style={[styles.label, {marginTop: 20}]}>Koordinaten</Text>
          <Text style={styles.value}>Lat: {data.lat}</Text>
          <Text style={styles.value}>Lon: {data.lon}</Text>
        </View>
      );
    } else if (sheetView === 'details_assign') {
      title = "Belegungsliste";
      content = (
        <View>
          {data.belegung.length === 0 && <Text style={styles.emptyText}>Keine Belegung</Text>}
          {data.belegung.map((b) => (
            <View key={b.id} style={styles.listItem}>
              <View style={styles.row}>
                <View style={[styles.portDot, { backgroundColor: b.status === 'Belegt' ? 'red' : 'green'}]} />
                <Text style={styles.listTitle}>Port {b.port}</Text>
              </View>
              <Text style={styles.listSub}>{b.type}</Text>
            </View>
          ))}
        </View>
      );
    } else if (sheetView === 'details_task') {
      title = "Task Liste";
      content = (
        <View>
           {/* HIER IST DIE ÄNDERUNG: Shortcut zu Kopfdaten */}
           <View style={styles.shortcutContainer}>
              <View style={styles.shortcutContent}>
                 <Edit3 size={20} color="#f59e0b" style={{marginBottom: 4}}/>
                 <Text style={styles.shortcutTitle}>Kopfdaten bearbeiten</Text>
                 <Text style={styles.shortcutSub}>Daten aktualisieren?</Text>
              </View>
              <TouchableOpacity 
                style={styles.shortcutBtn}
                onPress={() => navigateTo('details_head')}
              >
                <Text style={styles.shortcutBtnText}>Zum Formular</Text>
                <ArrowRight size={16} color="white" />
              </TouchableOpacity>
           </View>

           <Text style={[styles.label, {marginTop: 20, marginBottom: 10}]}>Offene Aufgaben</Text>

          {data.tasks.map((t, i) => (
            <View key={i} style={styles.taskItem}>
               <CheckSquare size={20} color="#3b82f6" style={{marginRight: 10}}/>
               <Text style={styles.taskText}>{t}</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addTaskBtn}>
             <Text style={styles.addTaskBtnText}>+ Neue Aufgabe</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft color="#334155" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <BottomSheetScrollView contentContainerStyle={{paddingBottom: 40}}>
          {content}
        </BottomSheetScrollView>
      </View>
    );
  };

  // --- MAIN RENDER ---
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        
        {/* MAP VIEW */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          mapType={mapType}
          initialRegion={{
            latitude: 51.1657,
            longitude: 10.4515,
            latitudeDelta: 5,
            longitudeDelta: 5,
          }}
        >
          {DUMMY_DATA.map((pin) => (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lon }}
              onPress={() => handlePinPress(pin.id)}
            >
              <View style={[styles.marker, selectedPinId === pin.id && styles.markerActive]}>
                <MapPin color={selectedPinId === pin.id ? "white" : "#1e293b"} size={20} />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* OVERLAY UI */}
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings color="#334155" size={24} />
        </TouchableOpacity>

        <View style={styles.topRightContainer}>
          <View style={styles.mapControlsWrapper}>
            <TouchableOpacity onPress={toggleMapOptions} style={styles.controlBtn}>
               {mapType === 'standard' ? <Layers color="#334155" size={24}/> : <Satellite color="#334155" size={24}/>}
            </TouchableOpacity>
            <View style={[styles.expandableContent, { height: mapOptionsOpen ? 'auto' : 0, overflow: 'hidden' }]}>
               {mapOptionsOpen && (
                 <View style={{paddingTop: 10, gap: 10}}>
                    <TouchableOpacity onPress={() => setMapType('standard')} style={styles.optionRow}>
                       <MapIcon size={16} color="#334155"/>
                       <Text style={styles.optionText}>Karte</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMapType('satellite')} style={styles.optionRow}>
                       <Satellite size={16} color="#334155"/>
                       <Text style={styles.optionText}>Satellit</Text>
                    </TouchableOpacity>
                 </View>
               )}
            </View>
          </View>
          <View style={styles.zoomContainer}>
            <TouchableOpacity style={styles.zoomBtn}><Plus color="#334155" size={24} /></TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.zoomBtn}><Minus color="#334155" size={24} /></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.controlBtn, {marginTop: 10}]}>
             <Navigation color="#2563eb" size={24} />
          </TouchableOpacity>
        </View>


        {/* BOTTOM SHEET */}
        <BottomSheet
          ref={bottomSheetRef}
          index={selectedPinId ? 1 : 0} 
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          backgroundStyle={styles.sheetBackground}
        >
          {sheetView === 'card' ? (
            <BottomSheetFlatList
              ref={flatListRef}
              data={DUMMY_DATA}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCardItem}
              horizontal
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContentContainer}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />
          ) : (
            <View style={{flex: 1, paddingHorizontal: 20}}>
               {sheetView === 'options' && renderOptions()}
               {sheetView.startsWith('details_') && renderDetails()}
            </View>
          )}
        </BottomSheet>

      </View>
    </GestureHandlerRootView>
  );
}

const OptionItem = ({ icon, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.optionItem}>
    <View style={styles.optionIconContainer}>{icon}</View>
    <Text style={styles.optionLabel}>{label}</Text>
    <ArrowLeft style={{transform: [{rotate: '180deg'}]}} color="#cbd5e1" size={20} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  marker: { backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 5 },
  markerActive: { backgroundColor: '#2563eb' },
  settingsBtn: { position: 'absolute', top: 60, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 25, elevation: 4 },
  topRightContainer: { position: 'absolute', top: 60, right: 20, alignItems: 'flex-end' },
  mapControlsWrapper: { backgroundColor: 'white', borderRadius: 12, padding: 5, alignItems: 'center', elevation: 4, minWidth: 50 },
  controlBtn: { width: 44, height: 44, backgroundColor: 'white', borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  expandableContent: { width: '100%', alignItems: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  optionText: { fontSize: 12, color: '#334155' },
  zoomContainer: { marginTop: 10, backgroundColor: 'white', borderRadius: 12, elevation: 4 },
  zoomBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#e2e8f0' },
  sheetBackground: { borderRadius: 24, elevation: 10 },
  
  // CARD CAROUSEL STYLES
  listContentContainer: { paddingHorizontal: 0 },
  cardWrapper: { width: SCREEN_WIDTH, paddingHorizontal: 20 },
  cardContainer: { marginTop: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  iconBtn: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  addressBox: { marginTop: 15, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 },
  addressText: { color: '#64748b', fontSize: 13 },
  actionRow: { flexDirection: 'row', marginTop: 24, gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  secondaryBtn: { width: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12 },
  
  // OTHER VIEWS
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  backBtn: { padding: 8, marginRight: 10, marginLeft: -10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  contextLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 15, fontWeight: '600' },
  optionsList: { gap: 12 },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16 },
  optionIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#334155' },
  detailBlock: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 16, color: '#1e293b', marginBottom: 2 },
  listItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  row: { flexDirection: 'row', alignItems: 'center' },
  portDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  listSub: { fontSize: 14, color: '#64748b', marginTop: 4, marginLeft: 20 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#eff6ff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#dbeafe' },
  taskText: { color: '#1e293b', fontSize: 15 },
  addTaskBtn: { marginTop: 10, padding: 15, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center' },
  addTaskBtnText: { color: '#64748b', fontWeight: '600' },

  // SHORTCUT STYLES
  shortcutContainer: { flexDirection: 'row', backgroundColor: '#fff7ed', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ffedd5', alignItems: 'center', justifyContent: 'space-between' },
  shortcutContent: { flex: 1 },
  shortcutTitle: { fontSize: 16, fontWeight: 'bold', color: '#9a3412' },
  shortcutSub: { fontSize: 12, color: '#c2410c' },
  shortcutBtn: { flexDirection: 'row', backgroundColor: '#ea580c', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  shortcutBtnText: { color: 'white', fontSize: 12, fontWeight: '600', marginRight: 4 }
});
