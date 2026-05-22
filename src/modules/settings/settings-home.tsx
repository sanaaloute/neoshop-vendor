"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getUserMe,
  patchUserMe,
  getUserSettings,
  patchUserSettings,
} from "@/services/vendor/users-api";
import type { UserMeResponse } from "@/services/vendor/types";
import type { UserSettingsResponse } from "@/services/vendor/users-api";

export function SettingsHome() {
  const [profile, setProfile] = useState<UserMeResponse | null>(null);
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, s] = await Promise.all([getUserMe(), getUserSettings()]);
        if (!cancelled) {
          setProfile(p);
          setSettings(s ?? {});
        }
      } catch (e) {
        if (!cancelled) {
          setError(httpErrorMessageForUser(e, "Could not load settings."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const updated = await patchUserMe({
        name: profile.name ?? undefined,
        surname: profile.surname ?? undefined,
        avatarUrl: profile.avatarUrl ?? undefined,
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (e) {
      setProfileError(httpErrorMessageForUser(e, "Could not update profile."));
    } finally {
      setProfileSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(false);
    try {
      const updated = await patchUserSettings({
        orderUpdates: settings.orderUpdates,
        promoMessages: settings.promoMessages,
        emailNewsletter: settings.emailNewsletter,
        pushEnabled: settings.pushEnabled,
      });
      setSettings(updated ?? {});
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (e) {
      setSettingsError(httpErrorMessageForUser(e, "Could not update preferences."));
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading settings…
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-10 text-sm">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <DashboardCard className="gap-0 py-0">
        <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
          <DashboardCardTitle className="text-base">Profile</DashboardCardTitle>
          <DashboardCardDescription>
            Update your public profile information.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-4 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">First name</Label>
              <Input
                id="name"
                value={profile?.name ?? ""}
                onChange={(e) =>
                  setProfile((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Last name</Label>
              <Input
                id="surname"
                value={profile?.surname ?? ""}
                onChange={(e) =>
                  setProfile((prev) => (prev ? { ...prev, surname: e.target.value } : prev))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              value={profile?.avatarUrl ?? ""}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, avatarUrl: e.target.value } : prev))
              }
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} disabled />
          </div>
          {profileError ? (
            <p className="text-destructive text-sm">{profileError}</p>
          ) : null}
          {profileSuccess ? (
            <p className="text-emerald-600 text-sm">Profile saved.</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="button" onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>
        </DashboardCardContent>
      </DashboardCard>

      <DashboardCard className="gap-0 py-0">
        <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
          <DashboardCardTitle className="text-base">Preferences</DashboardCardTitle>
          <DashboardCardDescription>
            Control what notifications and messages you receive.
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-4 px-4 py-4">
          {(
            [
              { key: "orderUpdates", label: "Order updates" },
              { key: "promoMessages", label: "Promotional messages" },
              { key: "emailNewsletter", label: "Email newsletter" },
              { key: "pushEnabled", label: "Push notifications" },
            ] as const
          ).map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
            >
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                className="accent-primary size-4"
                checked={settings?.[key] ?? false}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, [key]: e.target.checked } : prev
                  )
                }
              />
            </label>
          ))}
          {settingsError ? (
            <p className="text-destructive text-sm">{settingsError}</p>
          ) : null}
          {settingsSuccess ? (
            <p className="text-emerald-600 text-sm">Preferences saved.</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="button" onClick={saveSettings} disabled={settingsSaving}>
              {settingsSaving ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save preferences"
              )}
            </Button>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
