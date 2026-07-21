import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { Text } from '../src/components/Text';
import { saveTasteProfile } from '../src/lib/taste';
import { setOnboarded } from '../src/lib/onboarding';
import { screenMargin, space, useTheme } from '../src/theme';

/**
 * Taste intro: short, elegant, magazine-toned. Sets the premium first
 * impression and captures onboarding answers -> taste_profiles.
 */
const STEPS = [
  {
    key: 'cuisines' as const,
    kicker: 'First, the food',
    title: 'What do you love to eat?',
    options: ['Italian', 'Japanese', 'Indian', 'British', 'Middle Eastern', 'French', 'Small plates', 'Natural wine'],
  },
  {
    key: 'price_bands' as const,
    kicker: 'Your comfort zone',
    title: 'How do you like to spend?',
    options: ['£', '££', '£££', '££££'],
  },
  {
    key: 'vibes' as const,
    kicker: 'The feeling',
    title: "What's your kind of room?",
    options: ['Buzzy', 'Intimate', 'Design-led', 'Old-school', 'Hidden gem', 'Sunny terrace'],
  },
  {
    key: 'occasions' as const,
    kicker: 'And the moment',
    title: 'What are you here for?',
    options: ['Date night', 'Take your parents', 'Solo lunch', 'With friends', 'A celebration'],
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { c } = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const current = STEPS[step];
  const selected = answers[current.key] ?? [];
  const isLast = step === STEPS.length - 1;

  const toggle = (opt: string) =>
    setAnswers((a) => {
      const list = a[current.key] ?? [];
      return {
        ...a,
        [current.key]: list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt],
      };
    });

  const finish = async () => {
    await setOnboarded();
    // Persist if signed in; silently skip otherwise (kept local for later sync).
    saveTasteProfile(answers).catch(() => undefined);
    router.replace('/');
  };

  return (
    <View style={[styles.fill, { backgroundColor: c.paper, paddingTop: insets.top + space.xxl }]}>
      <View style={styles.head}>
        <Text variant="overline" accent>
          {`${step + 1} / ${STEPS.length}`}
        </Text>
      </View>

      <Animated.View key={current.key} entering={FadeIn.duration(300)} style={styles.body}>
        <Text variant="overline" muted style={{ marginBottom: space.sm }}>
          {current.kicker}
        </Text>
        <Text variant="title">{current.title}</Text>

        <ScrollView contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
          {current.options.map((opt) => (
            <Chip key={opt} label={opt} selected={selected.includes(opt)} onPress={() => toggle(opt)} />
          ))}
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Button
          title={isLast ? 'Start exploring' : 'Continue'}
          onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
        />
        {!isLast ? (
          <Button title="Skip" variant="secondary" style={{ marginTop: space.sm }} onPress={finish} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: { paddingHorizontal: screenMargin },
  body: { flex: 1, paddingHorizontal: screenMargin, marginTop: space.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingVertical: space.xl },
  footer: { paddingHorizontal: screenMargin },
});
