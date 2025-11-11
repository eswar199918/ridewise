// App.js — RideWise Final MVP v5 (Fully Polished)

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  ToastAndroid,
  Platform,
  Modal,
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  bg: "#0B0F14",
  card: "#121923",
  text: "#E9EEF5",
  sub: "#9FB0C3",
  accent: "#4F8EF7",
  border: "#223041",
  success: "#22C55E",
};

const VEHICLE_TYPES = [
  { key: "bike", label: "Bike", image: require("./assets/bike.png") },
  { key: "auto", label: "Auto", image: require("./assets/auto.png") },
  { key: "car", label: "Car", image: require("./assets/car.png") },
  { key: "xl", label: "Car XL", image: require("./assets/carxl.png") },
  { key: "parcel", label: "Parcel", image: require("./assets/parcel.png") },
];

const MOCK = [
  { provider: "Uber", fare: 59, eta: 5 },
  { provider: "Ola", fare: 49, eta: 7 },
  { provider: "Rapido", fare: 39, eta: 4 },
];

const PROVIDER_LINKS = {
  uber: { scheme: "uber://", store: "https://play.google.com/store/apps/details?id=com.ubercab" },
  ola: { scheme: "ola://", store: "https://play.google.com/store/apps/details?id=com.olacabs.customer" },
  rapido: { scheme: "rapido://", store: "https://play.google.com/store/apps/details?id=com.rapido.passenger" },
};

function toast(msg) {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
}

async function loadFares() {
  await new Promise((r) => setTimeout(r, 600));
  const sorted = [...MOCK].sort((a, b) => a.fare - b.fare);
  return { data: sorted, updatedAt: new Date().toISOString() };
}

async function openApp(provider) {
  const app = PROVIDER_LINKS[provider.toLowerCase()];
  if (!app) return;
  const supported = await Linking.canOpenURL(app.scheme);
  if (supported) await Linking.openURL(app.scheme);
  else await Linking.openURL(app.store);
}

// =================== HOME ===================
function HomeScreen({ navigation }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("bike");

  const canCompare = useMemo(() => from && to, [from, to]);

  const swapPlaces = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>RIDEWISE</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>FROM</Text>
          <TextInput
            style={styles.input}
            placeholder="Pickup location"
            placeholderTextColor={COLORS.sub}
            value={from}
            onChangeText={setFrom}
          />
          <TouchableOpacity style={styles.swapBtn} onPress={swapPlaces}>
            <Icon name="swap-vertical" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 12 }]}>TO</Text>
          <TextInput
            style={styles.input}
            placeholder="Drop location"
            placeholderTextColor={COLORS.sub}
            value={to}
            onChangeText={setTo}
          />
        </View>

        <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>
          SELECT RIDE TYPE
        </Text>

        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.vehicleCard,
                type === v.key && { borderColor: COLORS.accent },
              ]}
              onPress={() => setType(v.key)}
            >
              <Image source={v.image} style={styles.vehicleImage} />
              <Text
                style={[
                  styles.vehicleText,
                  type === v.key && { color: COLORS.accent },
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          disabled={!canCompare}
          onPress={() => navigation.navigate("Results", { from, to, type })}
          style={[styles.compareBtn, !canCompare && { opacity: 0.5 }]}
        >
          <Icon name="swap-vertical-outline" size={18} color="#0B0F14" />
          <Text style={styles.compareText}>Compare Fares</Text>
        </TouchableOpacity>

        <Text style={styles.tagline}>Compare. Decide. Ride Wise.</Text>
      </View>
    </SafeAreaView>
  );
}

// =================== RESULTS ===================
function ResultsScreen({ route }) {
  const { from, to, type } = route.params;
  const [state, setState] = useState({ loading: true, list: [], updatedAt: "" });

  useEffect(() => {
    (async () => {
      const res = await loadFares();
      setState({ loading: false, list: res.data, updatedAt: res.updatedAt });
    })();
  }, [from, to, type]);

  const cheapest = state.list[0]?.fare;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>RIDEWISE</Text>

          <View style={styles.resultInfoBox}>
            <Text style={styles.routeText}>
              {from} → {to}
            </Text>
            <Text style={styles.resultSub}>
              Type: {type.toUpperCase()} • Updated:{" "}
              {new Date(state.updatedAt).toLocaleTimeString()}
            </Text>
          </View>

          {state.loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={state.list}
              keyExtractor={(item, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => openApp(item.provider)}
                  style={[
                    styles.card,
                    item.fare === cheapest && {
                      borderColor: COLORS.success,
                      shadowColor: COLORS.success,
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  <Text style={styles.provider}>{item.provider}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.fare}>₹ {item.fare}</Text>
                    <Text style={styles.eta}>{item.eta} min</Text>
                    {item.fare === cheapest && (
                      <Text style={styles.bestPrice}>Best Price 💸</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: 16 }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =================== ROUTES ===================
const ROUTES_KEY = "ridewise_saved_routes";

function RoutesScreen() {
  const [routes, setRoutes] = useState([]);
  const [showSaved, setShowSaved] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [toAddr, setToAddr] = useState("");

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(ROUTES_KEY);
      if (raw) setRoutes(JSON.parse(raw));
    })();
  }, []);

  async function persist(next) {
    setRoutes(next);
    await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(next));
  }

  const saveRoute = async () => {
    if (!routeName.trim() || !fromAddr.trim() || !toAddr.trim()) {
      toast("Please fill all fields");
      return;
    }
    const newRoute = { id: Date.now().toString(), name: routeName, from: fromAddr, to: toAddr };
    const next = [newRoute, ...routes];
    await persist(next);
    setRouteName(""); setFromAddr(""); setToAddr("");
    toast("Route saved");
  };

  const removeRoute = async (id) => {
    const next = routes.filter((r) => r.id !== id);
    await persist(next);
    toast("Route removed");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Routes</Text>

        {/* Saved Routes */}
        <TouchableOpacity
          style={[styles.savedBox, styles.rowBetween]}
          onPress={() => setShowSaved(!showSaved)}
        >
          <Text style={styles.sectionTitle}>Saved Routes</Text>
          <Icon name={showSaved ? "chevron-up" : "chevron-down"} size={20} color={COLORS.text} />
        </TouchableOpacity>

        {showSaved && (
          <View style={{ marginTop: 10 }}>
            {routes.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.sub}>No routes saved yet.</Text>
              </View>
            ) : (
              routes.map((r) => (
                <View key={r.id} style={styles.routeCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeName}>{r.name}</Text>
                    <Text style={styles.routeLine}>{r.from} → {r.to}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeRoute(r.id)}>
                    <Icon name="trash-outline" size={20} color={COLORS.sub} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Add New Route */}
        <TouchableOpacity
          style={[styles.savedBox, styles.rowBetween, { marginTop: 16 }]}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Text style={styles.sectionTitle}>Add New Route</Text>
          <Icon name={showAdd ? "chevron-up" : "chevron-down"} size={20} color={COLORS.text} />
        </TouchableOpacity>

        {showAdd && (
          <View style={[styles.savedBox, { marginTop: 10 }]}>
            <TextInput style={styles.input} value={routeName} onChangeText={setRouteName} placeholder="Enter route name" placeholderTextColor={COLORS.sub} />
            <TextInput style={[styles.input, { marginTop: 10 }]} value={fromAddr} onChangeText={setFromAddr} placeholder="From" placeholderTextColor={COLORS.sub} />
            <TextInput style={[styles.input, { marginTop: 10 }]} value={toAddr} onChangeText={setToAddr} placeholder="To" placeholderTextColor={COLORS.sub} />
            <TouchableOpacity style={[styles.smallSaveBtn, { marginTop: 12 }]} onPress={saveRoute}>
              <Text style={styles.smallSaveText}>Save Route</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =================== ACCOUNT ===================
function AccountScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Eswar");
  const [phone, setPhone] = useState("997637839");
  const [email, setEmail] = useState("eswar123@gmail.com");

  const toggleEdit = () => {
    if (isEditing) toast("Changes saved!");
    setIsEditing(!isEditing);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Account</Text>

        <View style={styles.accountBox}>
          {isEditing ? (
            <>
              <TextInput style={styles.editInput} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={COLORS.sub} />
              <TextInput style={styles.editInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone" placeholderTextColor={COLORS.sub} />
              <TextInput style={styles.editInput} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Email" placeholderTextColor={COLORS.sub} />
            </>
          ) : (
            <>
              <Text style={styles.accountName}>{name}</Text>
              <Text style={styles.accountValue}>{phone}</Text>
              <Text style={styles.accountValue}>{email}</Text>
            </>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={toggleEdit}>
            <Icon name={isEditing ? "save-outline" : "create-outline"} color="#0B0F14" size={16} />
            <Text style={styles.editBtnText}>{isEditing ? "Save" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Grid */}
        <View style={styles.accountGrid}>
          {[
            ["Help", "globe-outline"],
            ["Wallet", "wallet-outline"],
            ["Inbox", "mail-outline"],
            ["Offers", "gift-outline"],
            ["Safety", "shield-checkmark-outline"],
            ["About", "information-circle-outline"],
          ].map(([label, icon], i) => (
            <TouchableOpacity key={i} style={styles.accountCard}>
              <Icon name={icon} color={COLORS.sub} size={22} />
              <Text style={styles.accountCardText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy Box */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>Privacy & Disclaimer</Text>
          <Text style={styles.privacyText}>
            • We store your details and saved routes only on your device.
            {"\n"}• We are not affiliated with Uber, Ola, or Rapido.
            {"\n"}• Prices are estimates; check provider apps for final fares.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =================== NAVIGATION ===================
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.sub,
        tabBarIcon: ({ color, size }) => {
          const map = { Home: "home-outline", Routes: "map-outline", Account: "person-outline" };
          return <Icon name={map[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Routes" component={RoutesScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// =================== STYLES ===================
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  headerTitle: { textAlign: "center", color: COLORS.text, fontSize: 22, fontWeight: "900", marginBottom: 12 },
  label: { color: COLORS.sub, fontSize: 12 },

  inputWrap: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: "#0E1520",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swapBtn: {
    position: "absolute",
    right: 18,
    top: 64,
    backgroundColor: "#1B2735",
    padding: 6,
    borderRadius: 20,
  },

  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  vehicleCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    paddingVertical: 14,
  },
    vehicleImage: { width: 50, height: 50, resizeMode: "contain", marginBottom: 8 },
  vehicleText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },

  compareBtn: {
    marginTop: 16,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  compareText: { color: "#0B0F14", fontWeight: "800", fontSize: 14 },

  tagline: { color: COLORS.sub, textAlign: "center", fontSize: 12, marginTop: 16 },

  // ===== Results =====
  resultInfoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
  },
  routeText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  resultSub: { color: COLORS.text, fontSize: 13, textAlign: "center" },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  provider: { color: COLORS.text, fontWeight: "700" },
  fare: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  eta: { color: COLORS.sub, fontSize: 12 },
  bestPrice: { color: COLORS.success, fontSize: 12, fontWeight: "700" },

  // ===== Routes =====
  savedBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  routeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  routeName: { color: COLORS.text, fontWeight: "800", marginBottom: 3 },
  routeLine: { color: COLORS.sub },

  smallSaveBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  smallSaveText: { color: "#0B0F14", fontWeight: "800" },

  // ===== Account =====
  accountBox: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginBottom: 16,
  },
  accountName: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  accountValue: { color: COLORS.text, marginTop: 2 }, // phone & email in white
  editBtn: {
    marginTop: 12,
    backgroundColor: COLORS.success,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editBtnText: { color: "#0B0F14", fontWeight: "800" },
  editInput: {
    backgroundColor: "#0E1520",
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%",
    marginVertical: 6,
  },

  accountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  accountCard: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  accountCardText: { color: COLORS.text, fontWeight: "700", marginTop: 6 },

  privacyBox: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privacyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
  privacyText: { color: COLORS.text, lineHeight: 20 },
});

