import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { DirectoryModal } from "./DirectoryModal";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const HeaderActions: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [directoryVisible, setDirectoryVisible] = useState<boolean>(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("ChatList")}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles-outline" size={19} color="#234919" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setDirectoryVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={19} color="#234919" />
        </TouchableOpacity>
      </View>

      <DirectoryModal
        visible={directoryVisible}
        onClose={() => setDirectoryVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
});
