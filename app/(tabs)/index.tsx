import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  Activity,
  AlertTriangle,
  Calculator,
  Ruler,
  Save,
  Shield,
} from "lucide-react-native";

export default function EODCalculator() {
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [fechaCalculo, setFechaCalculo] = useState<Date | null>(null);

  // ===============================
  // PARÁMETROS TÉCNICOS (IDÉNTICOS)
  // ===============================
  const config = {
    TNT: { rho: 1630, re: 1.0 },
    C4: { rho: 1590, re: 1.34 },
    ANFO: { rho: 840, re: 0.82 },
    Dinamita: { rho: 1300, re: 0.92 },
    PETN: { rho: 1760, re: 1.66 },
  };

  const z_danos = {
    Leve: 7.0,
    Moderado: 4.5,
    Fuerte: 2.5,
    Ruptura: 1.2,
  };

  // ===============================
  // CÁLCULO (MISMA LÓGICA)
  // ===============================
  const calcular = () => {
    if (!largo || !ancho || !alto) {
      Alert.alert("Error", "Por favor ingrese todas las dimensiones.");
      return;
    }

    const l_m = parseFloat(largo) / 100;
    const a_m = parseFloat(ancho) / 100;
    const h_m = parseFloat(alto) / 100;
    const volumen = l_m * a_m * h_m;

    const nuevosResultados = Object.entries(config).map(
      ([nombre, datos]: any) => {
        const masa = volumen * datos.rho;
        const neq = masa * datos.re;
        const raiz = Math.cbrt(neq);

        const d_frag_base = 100 * raiz;
        const d_seguridad = d_frag_base * 1.5;
        const t_blindaje = 0.41 * raiz * 1.5;

        const daños = Object.entries(z_danos).map(
          ([nivel, z]: any) => ({
            nivel,
            distancia: z * raiz,
          })
        );

        return {
          nombre,
          masa,
          neq,
          d_frag_base,
          d_seguridad,
          t_blindaje,
          daños,
        };
      }
    );

    setResultados(nuevosResultados);
    setFechaCalculo(new Date());
  };

  // ===============================
  // GENERAR REPORTE TXT (NATIVO)
  // ===============================
  const generarReporte = async () => {
    if (!resultados.length) return;

    let contenido = "====================================================\n";
    contenido += "INFORME TÉCNICO UNIFICADO - EOD APP\n";
    contenido += `FECHA: ${fechaCalculo?.toLocaleString()}\n`;
    contenido += "====================================================\n\n";
    contenido += `DIMENSIONES: ${largo} x ${ancho} x ${alto} cm\n`;
    contenido += "FACTOR DE SEGURIDAD: 1.5x\n\n";

    resultados.forEach((r) => {
      contenido += `TIPO: ${r.nombre}\n`;
      contenido += ` - Masa Estimada: ${r.masa.toFixed(2)} kg\n`;
      contenido += ` - NEQ: ${r.neq.toFixed(2)} kg TNT\n`;
      contenido += ` - Distancia Base Fragmentación: ${r.d_frag_base.toFixed(
        2
      )} m\n`;
      contenido += ` - Perímetro Seguridad: ${r.d_seguridad.toFixed(2)} m\n`;
      contenido += ` - Blindaje Concreto: ${r.t_blindaje.toFixed(2)} m\n`;
      contenido += ` - Radios de Daño:\n`;

      r.daños.forEach((d: any) => {
        contenido += `    * ${d.nivel}: ${d.distancia.toFixed(2)} m\n`;
      });

      contenido += "----------------------------------------------------\n";
    });

    const path =
      FileSystem.documentDirectory! +
      `Reporte_EOD_${Date.now().toString()}.txt`;

    await FileSystem.writeAsStringAsync(path, contenido, {
      encoding: "utf8",
    });

    await Sharing.shareAsync(path);
  };

  // ===============================
  // UI
  // ===============================
  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Shield size={36} color="#22c55e" />
        <Text style={styles.title}>SISTEMA EOD</Text>
        <Text style={styles.subtitle}>
          Cálculo de Seguridad Estructural
        </Text>
      </View>

      {/* INPUTS */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ruler size={18} color="#22c55e" />
          <Text style={styles.sectionTitle}>
            Dimensiones del Bulto (cm)
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Largo"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={largo}
          onChangeText={setLargo}
        />
        <TextInput
          style={styles.input}
          placeholder="Ancho"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={ancho}
          onChangeText={setAncho}
        />
        <TextInput
          style={styles.input}
          placeholder="Alto"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={alto}
          onChangeText={setAlto}
        />

        <Pressable style={styles.btnPrimary} onPress={calcular}>
          <Calculator size={20} color="white" />
          <Text style={styles.btnText}>CALCULAR</Text>
        </Pressable>
      </View>

      {/* RESULTADOS */}
      {resultados.map((r, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.resultTitle}>{r.nombre}</Text>

          <View style={styles.metricRow}>
            <Activity size={16} color="#22c55e" />
            <Text style={styles.metricText}>
              Masa estimada: {r.masa.toFixed(2)} kg
            </Text>
          </View>

          <View style={styles.metricRow}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Text style={styles.metricText}>
              Distancia de Fragmentación: {r.d_frag_base.toFixed(2)} m
            </Text>
          </View>

          <View style={styles.metricRow}>
            <AlertTriangle size={16} color="#ef4444" />
            <Text style={styles.metricText}>
              Perímetro Seguridad: {r.d_seguridad.toFixed(2)} m
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Shield size={16} color="#60a5fa" />
            <Text style={styles.metricText}>
              Blindaje Concreto: {r.t_blindaje.toFixed(2)} m
            </Text>
          </View>

          <View style={styles.damageBlock}>
            <View style={styles.sectionHeader}>
              <Activity size={16} color="#94a3b8" />
              <Text style={styles.damageTitle}>
                Radios de Daño Estructural
              </Text>
            </View>

            {r.daños.map((d: any, i: number) => (
              <View key={i} style={styles.damageRow}>
                <Text style={styles.damageLabel}>{d.nivel}</Text>
                <Text style={styles.damageValue}>
                  {d.distancia.toFixed(2)} m
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* GUARDAR */}
      {resultados.length > 0 && (
        <Pressable style={styles.btnSecondary} onPress={generarReporte}>
          <Save size={18} color="white" />
          <Text style={styles.btnText}>GUARDAR INFORME</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ===============================
// ESTILOS TÁCTICOS
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#22c55e",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "#94a3b8",
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#020617",
    borderRadius: 8,
    padding: 10,
    color: "white",
    marginBottom: 8,
  },
  btnPrimary: {
    marginTop: 10,
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnSecondary: {
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 6,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metricText: {
    color: "#e5e7eb",
  },
  damageBlock: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  damageTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
  },
  damageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  damageLabel: {
    color: "#cbd5f5",
  },
  damageValue: {
    color: "#94a3b8",
    fontFamily: "monospace",
  },
});
