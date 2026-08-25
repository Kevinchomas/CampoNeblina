import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { getInmuebleByCodigo } from "../constants/inmuebles";
import { TipoResidente } from "../constants/types";
import { styles } from "./RegisterScreen.styles";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedulaDni, setCedulaDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoResidente, setTipoResidente] = useState<TipoResidente>("propietario");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [torre, setTorre] = useState<7 | 8>(7);
  const [piso, setPiso] = useState<number>(1);
  const [apartamento, setApartamento] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // En el piso 3 los apartamentos son 1, 2, 4, 5, 6 (omitiendo el 3); en los demás pisos son 1, 2, 3, 4, 5, 6
  const aptosDisponibles = piso === 3 ? [1, 2, 4, 5, 6] : [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    if (!aptosDisponibles.includes(apartamento)) {
      setApartamento(aptosDisponibles[0]);
    }
  }, [piso]);

  const handleRegister = async () => {
    if (!nombreCompleto.trim() || !cedulaDni.trim() || !telefono.trim() || !email.trim() || !password) {
      Alert.alert("Campos requeridos", "Por favor completa todos los campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Seguridad", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const codigoInmueble = `${torre}-${piso}-${apartamento}`;
    const inmuebleObj = getInmuebleByCodigo(codigoInmueble);

    if (!inmuebleObj) {
      Alert.alert("Inmueble no válido", `El inmueble ${codigoInmueble} no existe.`);
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        nombreCompleto: nombreCompleto.trim(),
        cedulaDni: cedulaDni.trim(),
        telefono: telefono.trim(),
        rol: "residente",
        tipoResidente,
        inmueble: inmuebleObj,
      });
    } catch (error: any) {
      let msg = "Error al registrar la cuenta.";
      if (error.code === "auth/email-already-in-use") {
        msg = "El correo ya está registrado por otro usuario.";
      } else if (error.message) {
        msg = error.message;
      }
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };
  const pisosDisponibles = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Registro de Residente</Text>
          <Text style={styles.subtitle}>Asóciate a tu apartamento en Campo Neblina</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>1. Datos Personales</Text>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput style={styles.input} placeholder="Ej. Juan Pérez" placeholderTextColor="#9CA3AF" value={nombreCompleto} onChangeText={setNombreCompleto} />

          <Text style={styles.label}>Cédula / DNI</Text>
          <TextInput style={styles.input} placeholder="Ej. V-12345678" placeholderTextColor="#9CA3AF" value={cedulaDni} onChangeText={setCedulaDni} />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput style={styles.input} placeholder="Ej. +58 412 1234567" placeholderTextColor="#9CA3AF" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

          <Text style={styles.label}>Rol en la Comunidad</Text>
          <View style={styles.selectorRow}>
            {(["propietario", "inquilino"] as TipoResidente[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.optionButton, tipoResidente === r && styles.optionButtonSelected]}
                onPress={() => setTipoResidente(r)}
              >
                <Text style={[styles.optionButtonText, tipoResidente === r && styles.optionButtonTextSelected]}>
                  {r === "propietario" ? "Propietario" : "Inquilino"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionHeader}>2. Inmueble</Text>
          <Text style={styles.label}>Torre</Text>
          <View style={styles.selectorRow}>
            {[7, 8].map((t) => (
              <TouchableOpacity key={t} style={[styles.optionButton, torre === t && styles.optionButtonSelected]} onPress={() => setTorre(t as 7 | 8)}>
                <Text style={[styles.optionButtonText, torre === t && styles.optionButtonTextSelected]}>Torre {t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Piso ({piso})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {pisosDisponibles.map((p) => (
              <TouchableOpacity key={p} style={[styles.chipButton, piso === p && styles.chipButtonSelected]} onPress={() => setPiso(p)}>
                <Text style={[styles.chipText, piso === p && styles.chipTextSelected]}>Piso {p} {p === 3 ? "(5 aptos)" : ""}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Apartamento ({apartamento})</Text>
          <View style={styles.selectorGrid}>
            {aptosDisponibles.map((a) => (
              <TouchableOpacity key={a} style={[styles.gridButton, apartamento === a && styles.gridButtonSelected]} onPress={() => setApartamento(a)}>
                <Text style={[styles.gridButtonText, apartamento === a && styles.gridButtonTextSelected]}>Apto {a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.codePreviewBox}>
            <Text style={styles.codePreviewLabel}>Código Inmueble:</Text>
            <Text style={styles.codePreviewValue}>{torre}-{piso}-{apartamento}</Text>
          </View>

          <Text style={styles.sectionHeader}>3. Cuenta de Acceso</Text>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput style={styles.input} placeholder="ejemplo@correo.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

          <Text style={styles.label}>Confirmar Contraseña</Text>
          <TextInput style={styles.input} placeholder="Repite tu contraseña" placeholderTextColor="#9CA3AF" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Registrarme</Text>}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

