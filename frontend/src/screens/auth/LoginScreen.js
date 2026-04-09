import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login, googleLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:
      "313010278557-qdf70pdnj7q821uan3cii0m9jl02qr8h.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      await googleLogin(idToken);
    } catch (err) {
      console.log("Google login error:", err);
      Alert.alert("Google Login Failed", "Could not sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid credentials. Please try again.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Logo / Header */}
        <View style={{ alignItems: "center", marginBottom: 40, marginTop: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#0F172A",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="car-sport" size={32} color="#FFFFFF" />
          </View>
          <Text
            style={{
              color: "#0F172A",
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            CABIT
          </Text>
          <Text
            style={{
              color: "#64748B",
              fontSize: 13,
              marginTop: 4,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Student Carpooling
          </Text>
        </View>

        {/* Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#0F172A",
              marginBottom: 4,
            }}
          >
            Welcome back
          </Text>
          <Text style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>
            Sign in to your account
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: "#475569",
              fontWeight: "600",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            USERNAME
          </Text>
          <TextInput
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 10,
              padding: 14,
              fontSize: 15,
              color: "#0F172A",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
            placeholder="Your username (e.g. Arnav Vyas)"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

          {/* Password */}
          <Text
            style={{
              fontSize: 12,
              color: "#475569",
              fontWeight: "600",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            PASSWORD
          </Text>
          <TextInput
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 10,
              padding: 14,
              fontSize: 15,
              color: "#0F172A",
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: "#2563EB",
              borderRadius: 10,
              padding: 14,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
            <Text
              style={{
                width: 40,
                textAlign: "center",
                color: "#94A3B8",
                fontSize: 12,
              }}
            >
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            onPress={() => promptAsync()}
            disabled={!request || loading}
            style={{
              flexDirection: "row",
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              padding: 14,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              marginBottom: 24,
            }}
          >
            <Ionicons
              name="logo-google"
              size={18}
              color="#0F172A"
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: "#0F172A", fontSize: 15, fontWeight: "600" }}>
              Sign in with Google
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: "#64748B", fontSize: 14 }}>
              Don't have an account?{" "}
              <Text style={{ color: "#2563EB", fontWeight: "600" }}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
