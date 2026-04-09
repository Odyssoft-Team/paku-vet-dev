import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import { Icon } from "@/components/common/Icon";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { GroomingRecord } from "./pet-detail";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

// ─── Sección reutilizable ─────────────────────────────────────────────────────

const Section: React.FC<{
  label: string;
  icon: string;
  children: React.ReactNode;
  surfaceColor: string;
  labelColor: string;
}> = ({ label, icon, children, surfaceColor, labelColor }) => (
  <View style={[styles.section, { backgroundColor: surfaceColor }]}>
    <View style={styles.sectionHeader}>
      <Icon name={icon as any} size={14} color={labelColor} />
      <Text style={[styles.sectionLabel, { color: labelColor }]}>{label}</Text>
    </View>
    {children}
  </View>
);

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function GroomingDetailScreen() {
  const { colors } = useTheme();
  const { data } = useLocalSearchParams<{ data: string }>();

  const [record, setRecord] = useState<GroomingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data) {
      try {
        setRecord(JSON.parse(data));
      } catch (e) {
        console.error("[GroomingDetail] Error al parsear:", e);
      } finally {
        setLoading(false);
      }
    }
  }, [data]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Detalle del servicio" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScreenHeader title="Detalle del servicio" />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            No se encontró el registro.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDone = record.status === "done";
  const statusColor = isDone ? "#10B981" : "#6B7280";
  const statusBg = isDone ? "#D1FAE5" : "#F3F4F6";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Detalle del servicio" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Cabecera: nombre del servicio + badge + precio ─────────────── */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTop}>
            <Text style={[styles.serviceName, { color: colors.text }]}>
              {record.service}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {isDone ? "Completado" : "Cancelado"}
              </Text>
            </View>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(record.total, record.currency)}
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(record.date)}
          </Text>
        </View>

        {/* ── Groomer ───────────────────────────────────────────────────── */}
        <Section
          label="ESPECIALISTA"
          icon="profile"
          surfaceColor={colors.surface}
          labelColor={colors.textSecondary}
        >
          <Text style={[styles.value, { color: colors.text }]}>
            {record.groomer}
          </Text>
        </Section>

        {/* ── Dirección ─────────────────────────────────────────────────── */}
        <Section
          label="DIRECCIÓN DEL SERVICIO"
          icon="gps"
          surfaceColor={colors.surface}
          labelColor={colors.textSecondary}
        >
          <Text style={[styles.value, { color: colors.text }]}>
            {record.address}
          </Text>
        </Section>

        {/* ── Métricas del servicio ──────────────────────────────────────── */}
        {isDone && (
          <View style={[styles.metricsRow]}>
            <View
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
            >
              <Icon name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {record.duration_min} min
              </Text>
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                Duración
              </Text>
            </View>
            <View
              style={[styles.metricCard, { backgroundColor: colors.surface }]}
            >
              <Icon name="pets" size={20} color={colors.primary} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {record.weight_kg} kg
              </Text>
              <Text
                style={[styles.metricLabel, { color: colors.textSecondary }]}
              >
                Peso registrado
              </Text>
            </View>
          </View>
        )}

        {/* ── Productos usados ───────────────────────────────────────────── */}
        {isDone && record.products_used.length > 0 && (
          <Section
            label="PRODUCTOS UTILIZADOS"
            icon="services"
            surfaceColor={colors.surface}
            labelColor={colors.textSecondary}
          >
            <View style={styles.tagList}>
              {record.products_used.map((product, i) => (
                <View
                  key={i}
                  style={[
                    styles.tag,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {product}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Observaciones ─────────────────────────────────────────────── */}
        <Section
          label="OBSERVACIONES"
          icon="file"
          surfaceColor={colors.surface}
          labelColor={colors.textSecondary}
        >
          <Text style={[styles.value, { color: colors.text }]}>
            {record.observations || "Sin observaciones adicionales."}
          </Text>
        </Section>

        {/* ── Próximo servicio recomendado ───────────────────────────────── */}
        {isDone && (
          <View
            style={[
              styles.nextSection,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Icon name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                PRÓXIMO SERVICIO RECOMENDADO
              </Text>
            </View>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatDate(record.next_recommended)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
  },

  // Hero card
  heroCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  price: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },

  // Sección
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: 20,
  },

  // Métricas
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  metricValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
  },

  // Próximo servicio — borde izquierdo de acento
  nextSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
});
