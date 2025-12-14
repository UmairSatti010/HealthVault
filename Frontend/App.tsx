// App.tsx — Full updated version with View Record screen
import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Type declarations for modules
declare module 'react-native-vector-icons/MaterialIcons';

const API = 'http://192.168.1.100:5000/api'; // change to 10.0.2.2:5000 for Android emulator if needed

// ---------------------- AUTH CONTEXT ----------------------
interface User {
  _id?: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  darkMode: boolean;
  toggleTheme: () => Promise<void>;
  refreshUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');
      const theme = await AsyncStorage.getItem('darkMode');
      if (theme === 'true') setDarkMode(true);
      if (token) {
        try {
          const res = await axios.get(`${API}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.user || res.data);
        } catch (err: any) {
          console.log('Auto-login failed:', err?.response?.data || (err && err.message) || err);
          await AsyncStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    await AsyncStorage.setItem('token', res.data.token);
    setUser(res.data.user || res.data);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password });
    await AsyncStorage.setItem('token', res.data.token);
    setUser(res.data.user || res.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const toggleTheme = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    await AsyncStorage.setItem('darkMode', newVal.toString());
  };

  const refreshUser = (u: User) => setUser(u);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, darkMode, toggleTheme, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// helper for dynamic colors
const useColors = () => {
  const { darkMode } = useAuth();
  return {
    bg: darkMode ? '#0f1720' : '#fff',
    card: darkMode ? '#0b1220' : '#fff',
    text: darkMode ? '#fff' : '#222',
    subText: darkMode ? '#cbd5e1' : '#666',
    inputBg: darkMode ? '#142033' : '#fff',
    border: darkMode ? '#1f2a37' : '#ddd',
    headerBg: darkMode ? '#071024' : '#fff',
    headerText: darkMode ? '#fff' : '#222',
  };
};

// ---------------------- SCREENS ----------------------

// LOGIN
const LoginScreen = ({ navigation }: any) => {
  const { login, darkMode } = useAuth();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill email and password');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.centerScreen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>HealthVault — Login</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
        placeholder="Email"
        placeholderTextColor={colors.subText}
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
        placeholder="Password"
        placeholderTextColor={colors.subText}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={[styles.link, { color: '#60a5fa' }]}>Don't have an account, Sign up?</Text>
      </TouchableOpacity>
    </View>
  );
};

// SIGNUP
const SignupScreen = ({ navigation }: any) => {
  const { signup } = useAuth();
  const colors = useColors();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill all fields');
    setBusy(true);
    try {
      await signup(name, email, password);
    } catch (err: any) {
      Alert.alert('Signup failed', err?.response?.data?.message || 'Error creating account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.centerScreen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.link, { color: '#60a5fa' }]}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// HOME
const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const colors = useColors();
  return (
    <View style={[styles.centerScreen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Welcome, {user?.name}</Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>Your health records are secure and private.</Text>

      <TouchableOpacity style={styles.bigBtn} onPress={() => navigation.navigate('Records')}>
        <Text style={styles.btnText}>Go to Health Records</Text>
      </TouchableOpacity>
    </View>
  );
};

// VIEW RECORD SCREEN - New screen for viewing full record details
const ViewRecordScreen = ({ navigation, route }: any) => {
  const { record } = route.params;
  const { darkMode } = useAuth();
  const colors = useColors();
  
  const [recordData, setRecordData] = useState(record);
  const [editing, setEditing] = useState(false);

  // Edit form states
  const [title, setTitle] = useState(record.title || '');
  const [medicalHistory, setMedicalHistory] = useState(record.medicalHistory || '');
  const [doctorNotes, setDoctorNotes] = useState(record.doctorNotes || '');
  const [bp, setBp] = useState(record.vitals?.bloodPressure || '');
  const [heartRate, setHeartRate] = useState(record.vitals?.heartRate || '');
  const [bloodSugar, setBloodSugar] = useState(record.vitals?.bloodSugar || '');
  const [weight, setWeight] = useState(record.vitals?.weight || '');
  const [height, setHeight] = useState(record.vitals?.height || '');
  const [labFile, setLabFile] = useState<any>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: colors.headerBg,
      },
      headerTintColor: colors.headerText,
      headerTitle: editing ? 'Edit Record' : 'View Record',
      headerLeft: () => (
        <TouchableOpacity onPress={() => {
          if (editing) {
            setEditing(false);
          } else {
            navigation.goBack();
          }
        }} style={{ marginLeft: 10 }}>
          <Icon name="arrow-back" size={24} color={colors.headerText} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          {!editing && (
            <>
              <TouchableOpacity onPress={() => setEditing(true)} style={{ marginRight: 15 }}>
                <Icon name="edit" size={24} color={colors.headerText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Icon name="delete" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [navigation, editing, colors]);

  const handleUpdate = async () => {
    if (!title) return Alert.alert('Validation', 'Title is required');
    setSaving(true);

    try {
      const form = new FormData();
      form.append('title', title);
      form.append('medicalHistory', medicalHistory || '');
      form.append('doctorNotes', doctorNotes || '');
      const vitalsObj = { bloodPressure: bp, heartRate, bloodSugar, weight, height };
      form.append('vitals', JSON.stringify(vitalsObj));

      if (labFile) {
        const appendLab = await appendFileToForm(form, 'labReport', labFile);
        await appendLab;
      }
      if (prescriptionFile) {
        const appendPrescription = await appendFileToForm(form, 'prescription', prescriptionFile);
        await appendPrescription;
      }

      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(`${API}/records/${record._id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setRecordData(res.data);
      setEditing(false);
      Alert.alert('Success', 'Record updated successfully');
    } catch (err: any) {
      console.log('Update error:', err?.response?.data || (err && err.message) || err);
      Alert.alert('Error', (err as any)?.response?.data?.message || 'Could not update record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${API}/records/${record._id}`, { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            Alert.alert('Success', 'Record deleted successfully');
            navigation.goBack();
          } catch (err: any) {
            console.log('Delete error:', err);
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  const appendFileToForm = async (form: FormData, fieldName: string, file: any) => {
    if (!file) return Promise.resolve();
    const uri = file.uri;
    const name = file.name || uri.split('/').pop();
    const type = (file.mimeType || file.type || 'application/octet-stream') as string;

    if (Platform.OS === 'web') {
      const blob = await fetch(uri).then((r) => r.blob());
      form.append(fieldName, blob, name);
    } else {
      form.append(fieldName, {
        uri,
        name,
        type,
      } as any);
    }
    return Promise.resolve();
  };

  const pickLabFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) {
        setLabFile(res.assets[0]);
      }
    } catch (err: any) {
      console.log('pick lab file error', err);
    }
  };

  const pickPrescriptionFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) {
        setPrescriptionFile(res.assets[0]);
      }
    } catch (err: any) {
      console.log('pick prescription file error', err);
    }
  };

  const openUrl = (path: string) => {
    const full = path.startsWith('http') ? path : `${API.replace('/api', '')}${path}`;
    if (typeof window !== 'undefined' && (window as any).open) {
      (window as any).open(full, '_blank');
    } else {
      Alert.alert('Open', full);
    }
  };

  if (editing) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
          placeholder="Title" 
          placeholderTextColor={colors.subText} 
          value={title} 
          onChangeText={setTitle} 
        />

        <Text style={[styles.label, { color: colors.subText }]}>Medical History</Text>
        <TextInput 
          style={[styles.input, { height: 100, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
          placeholder="Medical history..." 
          placeholderTextColor={colors.subText} 
          value={medicalHistory} 
          onChangeText={setMedicalHistory} 
          multiline 
        />

        <Text style={[styles.label, { color: colors.subText }]}>Doctor Notes</Text>
        <TextInput 
          style={[styles.input, { height: 80, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
          placeholder="Doctor notes..." 
          placeholderTextColor={colors.subText} 
          value={doctorNotes} 
          onChangeText={setDoctorNotes} 
          multiline 
        />

        <Text style={[styles.label, { color: colors.subText }]}>Vitals</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput 
            style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
            placeholder="Blood Pressure" 
            placeholderTextColor={colors.subText} 
            value={bp} 
            onChangeText={setBp} 
          />
          <TextInput 
            style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
            placeholder="Heart Rate" 
            placeholderTextColor={colors.subText} 
            value={heartRate} 
            onChangeText={setHeartRate} 
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput 
            style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
            placeholder="Blood Sugar" 
            placeholderTextColor={colors.subText} 
            value={bloodSugar} 
            onChangeText={setBloodSugar} 
          />
          <TextInput 
            style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
            placeholder="Weight" 
            placeholderTextColor={colors.subText} 
            value={weight} 
            onChangeText={setWeight} 
          />
        </View>
        <TextInput 
          style={[styles.input, { marginTop: 8, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
          placeholder="Height" 
          placeholderTextColor={colors.subText} 
          value={height} 
          onChangeText={setHeight} 
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity style={styles.smallOutlineBtn} onPress={pickLabFile}>
            <Text style={styles.smallOutlineText}>
              {labFile ? `Lab: ${labFile.name}` : recordData.files?.labReport ? 'Change Lab Report' : 'Pick Lab Report'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallOutlineBtn} onPress={pickPrescriptionFile}>
            <Text style={styles.smallOutlineText}>
              {prescriptionFile ? `Rx: ${prescriptionFile.name}` : recordData.files?.prescription ? 'Change Prescription' : 'Pick Prescription'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <TouchableOpacity 
            style={[styles.btnSmall, { flex: 1 }]} 
            onPress={handleUpdate} 
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btnSmall, { backgroundColor: '#6c757d', marginLeft: 8 }]} 
            onPress={() => setEditing(false)}
          >
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}>
      <View style={[styles.recordDetailCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.recordDetailTitle, { color: colors.text }]}>{recordData.title}</Text>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.subText }]}>Created:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {recordData.createdAt ? new Date(recordData.createdAt).toLocaleString() : '-'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.subText }]}>Last Updated:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {recordData.updatedAt ? new Date(recordData.updatedAt).toLocaleString() : '-'}
          </Text>
        </View>

        {recordData.medicalHistory ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Medical History</Text>
            <Text style={[styles.detailText, { color: colors.text }]}>{recordData.medicalHistory}</Text>
          </>
        ) : null}

        {recordData.doctorNotes ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Doctor Notes</Text>
            <Text style={[styles.detailText, { color: colors.text }]}>{recordData.doctorNotes}</Text>
          </>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Vitals</Text>
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: colors.subText }]}>Blood Pressure</Text>
            <Text style={[styles.vitalValue, { color: colors.text }]}>{recordData.vitals?.bloodPressure || 'Not recorded'}</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: colors.subText }]}>Heart Rate</Text>
            <Text style={[styles.vitalValue, { color: colors.text }]}>{recordData.vitals?.heartRate || 'Not recorded'}</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: colors.subText }]}>Blood Sugar</Text>
            <Text style={[styles.vitalValue, { color: colors.text }]}>{recordData.vitals?.bloodSugar || 'Not recorded'}</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: colors.subText }]}>Weight</Text>
            <Text style={[styles.vitalValue, { color: colors.text }]}>{recordData.vitals?.weight || 'Not recorded'}</Text>
          </View>
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalLabel, { color: colors.subText }]}>Height</Text>
            <Text style={[styles.vitalValue, { color: colors.text }]}>{recordData.vitals?.height || 'Not recorded'}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Attachments</Text>
        
        {recordData.files?.labReport ? (
          <TouchableOpacity 
            style={[styles.attachmentBtn, { borderColor: colors.border }]} 
            onPress={() => openUrl(recordData.files.labReport)}
          >
            <Icon name="description" size={20} color="#60a5fa" />
            <Text style={[styles.attachmentText, { color: colors.text, marginLeft: 8 }]}>Lab Report</Text>
            <Icon name="open-in-new" size={16} color={colors.subText} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.noAttachmentText, { color: colors.subText }]}>No lab report attached</Text>
        )}
        
        {recordData.files?.prescription ? (
          <TouchableOpacity 
            style={[styles.attachmentBtn, { borderColor: colors.border, marginTop: 8 }]} 
            onPress={() => openUrl(recordData.files.prescription)}
          >
            <Icon name="healing" size={20} color="#60a5fa" />
            <Text style={[styles.attachmentText, { color: colors.text, marginLeft: 8 }]}>Prescription</Text>
            <Icon name="open-in-new" size={16} color={colors.subText} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.noAttachmentText, { color: colors.subText, marginTop: 8 }]}>No prescription attached</Text>
        )}
      </View>
    </ScrollView>
  );
};

// RECORDS SCREEN — Updated with navigation to ViewRecordScreen
const RecordsScreen = ({ navigation }: any) => {
  const { user, darkMode } = useAuth();
  const colors = useColors();

  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Form states (used both for add & edit)
  const [title, setTitle] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [bp, setBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const [labFile, setLabFile] = useState<any>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<any>(null);

  const [saving, setSaving] = useState(false);

  // edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createdAtLabel, setCreatedAtLabel] = useState<string | null>(null);
  const [updatedAtLabel, setUpdatedAtLabel] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API}/records`, { headers: { Authorization: `Bearer ${token}` } });
      setRecords(res.data);
    } catch (err: any) {
      console.log('Fetch records error:', err?.response?.data || (err && err.message) || err);
      Alert.alert('Error', 'Unable to load records');
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const pickLabFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) {
        setLabFile(res.assets[0]);
      }
    } catch (err: any) {
      console.log('pick lab file error', err);
    }
  };

  const pickPrescriptionFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) {
        setPrescriptionFile(res.assets[0]);
      }
    } catch (err: any) {
      console.log('pick prescription file error', err);
    }
  };

  // append file helper
  const appendFileToForm = (form: FormData, fieldName: string, file: any) => {
    if (!file) return;
    const uri = file.uri;
    const name = file.name || uri.split('/').pop();
    const type = (file.mimeType || file.type || 'application/octet-stream') as string;

    if (Platform.OS === 'web') {
      // fetch blob and append
      return fetch(uri)
        .then((r) => r.blob())
        .then((blob) => {
          form.append(fieldName, blob, name);
        });
    } else {
      form.append(fieldName, {
        uri,
        name,
        type,
      } as any);
      return Promise.resolve();
    }
  };

  const resetForm = () => {
    setTitle('');
    setMedicalHistory('');
    setDoctorNotes('');
    setBp('');
    setHeartRate('');
    setBloodSugar('');
    setWeight('');
    setHeight('');
    setLabFile(null);
    setPrescriptionFile(null);
    setCreatedAtLabel(null);
    setUpdatedAtLabel(null);
    setEditingId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!title) return Alert.alert('Validation', 'Title is required');
    setSaving(true);

    try {
      const form = new FormData();
      form.append('title', title);
      form.append('medicalHistory', medicalHistory || '');
      form.append('doctorNotes', doctorNotes || '');
      const vitalsObj = { bloodPressure: bp, heartRate, bloodSugar, weight, height };
      form.append('vitals', JSON.stringify(vitalsObj));

      const tasks: Promise<any>[] = [];
      tasks.push(appendFileToForm(form, 'labReport', labFile) as any);
      tasks.push(appendFileToForm(form, 'prescription', prescriptionFile) as any);
      await Promise.all(tasks);

      const token = await AsyncStorage.getItem('token');

      if (editingId) {
        // update
        const res = await axios.put(`${API}/records/${editingId}`, form, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        Alert.alert('Saved', 'Record updated');
      } else {
        // create
        await axios.post(`${API}/records`, form, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        Alert.alert('Saved', 'Record added');
      }

      resetForm();
      fetchRecords();
    } catch (err: any) {
      console.log('Add/update record error:', err?.response?.data || (err && err.message) || err);
      Alert.alert('Error', (err as any)?.response?.data?.message || 'Could not save record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${API}/records/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchRecords();
          } catch (err: any) {
            console.log('delete error', err);
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  // edit: fill form with record
  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setTitle(item.title || '');
    setMedicalHistory(item.medicalHistory || '');
    setDoctorNotes(item.doctorNotes || '');
    setBp(item.vitals?.bloodPressure || '');
    setHeartRate(item.vitals?.heartRate || '');
    setBloodSugar(item.vitals?.bloodSugar || '');
    setWeight(item.vitals?.weight || '');
    setHeight(item.vitals?.height || '');
    setLabFile(null);
    setPrescriptionFile(null);
    setCreatedAtLabel(item.createdAt ? new Date(item.createdAt).toLocaleString() : null);
    setUpdatedAtLabel(item.updatedAt ? new Date(item.updatedAt).toLocaleString() : null);
  };

  const handleViewRecord = (item: any) => {
    navigation.navigate('ViewRecord', { record: item });
  };

  const renderRecord = ({ item }: any) => (
    <TouchableOpacity onPress={() => handleViewRecord(item)}>
      <View style={[styles.recordCard, { backgroundColor: colors.card }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.recordTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.smallText, { color: colors.subText }]}>
            Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
          </Text>
          <Text style={[styles.smallText, { color: colors.subText }]}>
            Edited: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
          </Text>

          {item.medicalHistory ? <Text numberOfLines={3} style={[styles.recordDesc, { color: colors.text }]}>{item.medicalHistory}</Text> : null}

          {item.vitals ? (
            <Text style={[styles.smallText, { color: colors.subText }]}>
              Vitals — BP: {item.vitals.bloodPressure || '-'}, HR: {item.vitals.heartRate || '-'}, Sugar: {item.vitals.bloodSugar || '-'}
            </Text>
          ) : null}

          {item.files?.labReport ? (
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation();
              const full = item.files.labReport.startsWith('http') ? item.files.labReport : `${API.replace('/api', '')}${item.files.labReport}`;
              if (typeof window !== 'undefined' && (window as any).open) {
                (window as any).open(full, '_blank');
              }
            }}>
              <Text style={[styles.linkSmall, { color: '#60a5fa' }]}>Open lab report</Text>
            </TouchableOpacity>
          ) : null}
          {item.files?.prescription ? (
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation();
              const full = item.files.prescription.startsWith('http') ? item.files.prescription : `${API.replace('/api', '')}${item.files.prescription}`;
              if (typeof window !== 'undefined' && (window as any).open) {
                (window as any).open(full, '_blank');
              }
            }}>
              <Text style={[styles.linkSmall, { color: '#60a5fa' }]}>Open prescription</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.iconBtn, { paddingHorizontal: 12 }]} 
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item._id);
            }}
          >
            <Text style={{ color: '#fff' }}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: '#1e88e5', marginTop: 8, paddingHorizontal: 12 }]} 
            onPress={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
          >
            <Text style={{ color: '#fff' }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const openUrl = (path: string) => {
    const full = path.startsWith('http') ? path : `${API.replace('/api', '')}${path}`;
    if (typeof window !== 'undefined' && (window as any).open) {
      (window as any).open(full, '_blank');
    } else {
      Alert.alert('Open', full);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>{editingId ? 'Edit Record' : 'Add New Record'}</Text>

      {editingId ? (
        <View style={{ marginBottom: 8 }}>
          <Text style={[styles.smallText, { color: colors.subText }]}>Created: {createdAtLabel}</Text>
          <Text style={[styles.smallText, { color: colors.subText }]}>Last edited: {updatedAtLabel}</Text>
        </View>
      ) : null}

      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Title" placeholderTextColor={colors.subText} value={title} onChangeText={setTitle} />

      <Text style={[styles.label, { color: colors.subText }]}>Medical History</Text>
      <TextInput style={[styles.input, { height: 100, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Medical history..." placeholderTextColor={colors.subText} value={medicalHistory} onChangeText={setMedicalHistory} multiline />

      <Text style={[styles.label, { color: colors.subText }]}>Doctor Notes</Text>
      <TextInput style={[styles.input, { height: 80, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Doctor notes..." placeholderTextColor={colors.subText} value={doctorNotes} onChangeText={setDoctorNotes} multiline />

      <Text style={[styles.label, { color: colors.subText }]}>Vitals</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Blood Pressure" placeholderTextColor={colors.subText} value={bp} onChangeText={setBp} />
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Heart Rate" placeholderTextColor={colors.subText} value={heartRate} onChangeText={setHeartRate} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Blood Sugar" placeholderTextColor={colors.subText} value={bloodSugar} onChangeText={setBloodSugar} />
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Weight" placeholderTextColor={colors.subText} value={weight} onChangeText={setWeight} />
      </View>
      <TextInput style={[styles.input, { marginTop: 8, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Height" placeholderTextColor={colors.subText} value={height} onChangeText={setHeight} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <TouchableOpacity style={styles.smallOutlineBtn} onPress={pickLabFile}>
          <Text style={styles.smallOutlineText}>{labFile ? `Lab: ${labFile.name}` : 'Pick Lab Report'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallOutlineBtn} onPress={pickPrescriptionFile}>
          <Text style={styles.smallOutlineText}>{prescriptionFile ? `Rx: ${prescriptionFile.name}` : 'Pick Prescription'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <TouchableOpacity style={[styles.btnSmall, { flex: 1 }]} onPress={handleAddOrUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editingId ? 'Update Record' : 'Save Record'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnSmall, { backgroundColor: '#6c757d', marginLeft: 8 }]} onPress={resetForm}>
          <Text style={styles.btnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.pageTitle, { marginTop: 20, color: colors.text }]}>Your Records</Text>

      {loadingRecords ? <ActivityIndicator /> : records.length === 0 ? <Text style={[styles.smallText, { color: colors.subText }]}>No records yet</Text> : <FlatList data={records} keyExtractor={(i) => i._id} renderItem={renderRecord} scrollEnabled={false} />}
    </ScrollView>
  );
};

// PROFILE (formerly Settings) — redesigned professional
const ProfileScreen = () => {
  const { user, logout, darkMode, toggleTheme, refreshUser } = useAuth();
  const colors = useColors();

  const [editVisible, setEditVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // edit states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileUri, setProfileUri] = useState<string | null>(user?.profilePicture ? `${API.replace('/api', '')}${user.profilePicture}` : null);
  const [newImageFile, setNewImageFile] = useState<any>(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setProfileUri(user?.profilePicture ? `${API.replace('/api', '')}${user.profilePicture}` : null);
  }, [user]);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');

  const pickProfileImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Permission to access photos is required');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if ((result as any).canceled) return;
      const uri = (result as any).assets && (result as any).assets.length ? (result as any).assets[0].uri : (result as any).uri;
      if (!uri) return;

      const file = {
        uri,
        name: uri.split('/').pop(),
        mimeType: 'image/jpeg',
      };
      setNewImageFile(file);
      setProfileUri(uri);
    } catch (err: any) {
      console.log('pick profile image error', err);
    }
  };

  const appendImageToForm = async (form: FormData) => {
    if (!newImageFile) return;
    const file = newImageFile;
    if (Platform.OS === 'web') {
      const blob = await fetch(file.uri).then((r) => r.blob());
      form.append('profile', blob, file.name);
    } else {
      form.append('profile', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'image/jpeg',
      } as any);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!name || !email) return Alert.alert('Validation', 'Name and email required');
      const form = new FormData();
      form.append('name', name);
      form.append('email', email);
      await appendImageToForm(form);

      const token = await AsyncStorage.getItem('token');
      const res = await axios.put(`${API}/users/update`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      refreshUser(res.data.user);
      setEditVisible(false);
      setNewImageFile(null);
      Alert.alert('Saved', 'Profile updated');
    } catch (err: any) {
      console.log('save profile error', err?.response?.data || (err && err.message) || err);
      Alert.alert('Error', (err as any)?.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNew) return Alert.alert('Validation', 'Fill all fields');
    if (newPassword !== confirmNew) return Alert.alert('Validation', 'New passwords do not match');
    setChangingPassword(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API}/users/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNew('');
      Alert.alert('Success', 'Password changed');
    } catch (err: any) {
      console.log('change pass err', err?.response?.data || (err && err.message) || err);
      Alert.alert('Error', (err as any)?.response?.data?.message || 'Change password failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Confirm', 'Permanently delete your account and all records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${API}/users/delete`, { headers: { Authorization: `Bearer ${token}` } });
            logout();
          } catch (err: any) {
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.bg }}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <View style={{ position: 'relative' }}>
          {profileUri ? (
            <Image source={{ uri: profileUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ddd' }]}>
              <Text style={{ fontSize: 24 }}>{(user?.name || 'U').charAt(0)}</Text>
            </View>
          )}

          {/* pencil overlay positioned on edge */}
          <TouchableOpacity
            style={[styles.pencilBtn, { right: 4, bottom: 4, top: undefined }]}
            onPress={pickProfileImage}
          >
            <Icon name="edit" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.subText }]}>Name</Text>
      <Text style={[styles.profileText, { color: colors.text }]}>{user?.name}</Text>

      <Text style={[styles.label, { color: colors.subText }]}>Email</Text>
      <Text style={[styles.profileText, { color: colors.text }]}>{user?.email}</Text>

      <View style={{ marginTop: 14 }}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => setEditVisible(true)}>
          <Text style={styles.smallBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallBtn} onPress={() => setPasswordVisible(true)}>
          <Text style={styles.smallBtnText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallBtn} onPress={toggleTheme}>
          <Text style={styles.smallBtnText}>{darkMode ? 'Switch to Light' : 'Switch to Dark'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16, backgroundColor: colors.bg }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Edit Profile</Text>

          <TouchableOpacity style={{ alignItems: 'center', marginVertical: 12 }} onPress={pickProfileImage}>
            {profileUri ? <Image source={{ uri: profileUri }} style={[styles.avatar, { marginBottom: 8 }]} /> : null}
            <Text style={{ color: '#60a5fa' }}>Change profile picture</Text>
          </TouchableOpacity>

          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder="Full name" />
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity style={[styles.btnSmall, { flex: 1 }]} onPress={handleSaveProfile}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSmall, { flex: 1, backgroundColor: '#6c757d', marginLeft: 8 }]} onPress={() => setEditVisible(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={passwordVisible} animationType="slide">
        <View style={{ flex: 1, padding: 16, backgroundColor: colors.bg }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Change Password</Text>

          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Old password" placeholderTextColor={colors.subText} secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="New password" placeholderTextColor={colors.subText} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Confirm new password" placeholderTextColor={colors.subText} secureTextEntry value={confirmNew} onChangeText={setConfirmNew} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity style={[styles.btnSmall, { flex: 1 }]} onPress={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Change</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnSmall, { flex: 1, backgroundColor: '#6c757d', marginLeft: 8 }]} onPress={() => setPasswordVisible(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ---------------------- NAVIGATION ----------------------
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const Tabs = () => {
  const { darkMode } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: darkMode ? '#071024' : '#fff' },
        tabBarActiveTintColor: darkMode ? '#fff' : '#1e88e5',
        tabBarInactiveTintColor: darkMode ? '#94a3b8' : '#666',
        tabBarIcon: ({ color }) => {
          const name = route.name === 'Home' ? 'home' : route.name === 'Records' ? 'folder' : 'person';
          return <Icon name={name} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Records" component={RecordsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainStack = () => {
  const { user, loading, darkMode } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={darkMode ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={Tabs} />
            <Stack.Screen 
              name="ViewRecord" 
              component={ViewRecordScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ---------------------- MAIN APP ----------------------
export default function App() {
  return (
    <AuthProvider>
      <MainStack />
    </AuthProvider>
  );
}

// ---------------------- STYLES ----------------------
const styles = StyleSheet.create({
  // ---------- Layout ----------
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },

  // ---------- Text ----------
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },

  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },

  // ---------- Inputs (LOGIN / SIGNUP BIG INPUTS) ----------
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 18,
  },

  // ---------- Buttons ----------
  btn: {
    backgroundColor: '#007bff',
    width: '70%',
    height: 56,
    borderRadius: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bigBtn: {
    backgroundColor: '#007bff',
    width: '70%',
    height: 60,
    borderRadius: 18,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

  btnSmall: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  btnSmallText: {
    color: '#fff',
    fontWeight: '600',
  },

  smallBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },

  smallBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  link: {
    marginTop: 16,
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16,
  },

  // ---------- Records ----------
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  recordTitle: {
    fontWeight: '700',
    fontSize: 16,
  },

  recordDesc: {
    marginTop: 6,
    color: '#333',
  },

  smallText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },

  linkSmall: {
    color: '#007bff',
    marginTop: 6,
    fontSize: 14,
  },

  // ---------- View Record Styles ----------
  recordDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
  },

  recordDetailTitle: {
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 14,
    color: '#666',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 8,
  },

  detailText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },

  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  vitalItem: {
    width: '50%',
    paddingVertical: 8,
  },

  vitalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  vitalValue: {
    fontSize: 16,
    fontWeight: '500',
  },

  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },

  attachmentText: {
    fontSize: 16,
    fontWeight: '500',
  },

  noAttachmentText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  // ---------- Icons / Actions ----------
  iconBtn: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 8,
  },

  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },

  smallOutlineText: {
    color: '#007bff',
    textAlign: 'center',
    fontSize: 15,
  },

  deleteBtn: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },

  deleteText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  logoutBtn: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  // ---------- Profile ----------
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999,
    marginBottom: 8,
  },

  pencilBtn: {
    position: 'absolute',
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 999,
    right: 4,
    bottom: 4,
  },

  profileText: {
    fontSize: 17,
    color: '#222',
    marginBottom: 10,
  },
});