import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { useAuth } from '../src/lib/auth';
import { radius, screenMargin, space, useTheme } from '../src/theme';

/** Sign in: Directus email/password + Sign in with Apple. Optional in v1. */
export default function Auth() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { c, scheme } = useTheme();
  const { signInEmail, signInApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.back();
    } catch (e) {
      setError('That did not work. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.fill, { backgroundColor: c.paper, paddingTop: insets.top + space.xxxl }]}
    >
      <View style={styles.body}>
        <Text variant="overline" accent>
          Welcome
        </Text>
        <Text variant="title" style={{ marginTop: space.xs }}>
          Save your taste
        </Text>
        <Text variant="body" muted style={{ marginTop: space.sm }}>
          Sign in to keep your picks and preferences across devices.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={c.inkMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="username"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: c.divider, color: c.ink, backgroundColor: c.card }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={c.inkMuted}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: c.divider, color: c.ink, backgroundColor: c.card }]}
        />

        {error ? (
          <Text variant="caption" accent style={{ marginBottom: space.sm }}>
            {error}
          </Text>
        ) : null}

        <Button title="Sign in" loading={busy} onPress={() => run(() => signInEmail(email, password))} />

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={radius.pill}
          style={styles.apple}
          onPress={() => run(signInApple)}
        />

        <Button
          title="Not now"
          variant="secondary"
          style={{ marginTop: space.md }}
          onPress={() => router.back()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { paddingHorizontal: screenMargin },
  input: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    fontSize: 16,
    marginTop: space.md,
  },
  apple: { height: 52, marginTop: space.md },
});
