import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { setCurrentUser } from "../services/storage";
import "./AccountPage.css";

interface ApiKeyDisplay {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewKeyResponse {
  key: ApiKeyDisplay & { fullKey: string };
}

export const AccountPage = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Map Clerk user to our user shape
  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "",
      }
    : null;

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyDisplay[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingKeys(true);
    try {
      const res = await fetch(`/api/keys?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      setCurrentUser(null);
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsSigningOut(false);
    }
  };

  const handleCreateKey = async () => {
    if (!user?.id || !newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name: newKeyName.trim() }),
      });
      if (res.ok) {
        const data: NewKeyResponse = await res.json();
        setShowNewKey(data.key.fullKey);
        setNewKeyName("");
        loadApiKeys();
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!user?.id) return;
    setDeletingKeyId(keyId);
    try {
      const res = await fetch(`/api/keys/${keyId}?userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setApiKeys((keys) => keys.filter((k) => k.id !== keyId));
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isLoaded || !user) return null;

  return (
    <div className="account-page">
      <h1 className="account-page__title">Account</h1>

      <section className="account-section">
        <h2 className="account-section__title">Profile</h2>
        <div className="account-section__content">
          <div className="account-field">
            <span className="account-field__label">Name</span>
            <span className="account-field__value">{user.name || "—"}</span>
          </div>
          <div className="account-field">
            <span className="account-field__label">Email</span>
            <span className="account-field__value">{user.email}</span>
          </div>
        </div>
      </section>

      <section className="account-section">
        <h2 className="account-section__title">API Keys</h2>
        <p className="account-section__description">
          Create API keys to connect MCP clients (like Claude Desktop) to your
          wardrobe.
        </p>

        {/* New Key Alert */}
        {showNewKey && (
          <div className="api-key-alert">
            <div className="api-key-alert__header">
              <strong>New API Key Created</strong>
              <button
                className="api-key-alert__close"
                onClick={() => setShowNewKey(null)}
              >
                ×
              </button>
            </div>
            <p className="api-key-alert__warning">
              Copy this key now. You won&apos;t be able to see it again!
            </p>
            <div className="api-key-alert__key-container">
              <code className="api-key-alert__key">{showNewKey}</code>
              <button
                className="api-key-alert__copy"
                onClick={() => handleCopyKey(showNewKey)}
              >
                {copiedKey ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="api-key-alert__config">
              <p className="api-key-alert__config-label">
                Claude Desktop config:
              </p>
              <pre className="api-key-alert__config-code">
                {JSON.stringify(
                  {
                    mcpServers: {
                      wardrobe: {
                        url: `${window.location.origin}/api/mcp`,
                        headers: {
                          Authorization: `Bearer ${showNewKey}`,
                        },
                      },
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Create New Key Form */}
        <div className="api-key-form">
          <input
            type="text"
            className="api-key-form__input"
            placeholder="Key name (e.g., Claude Desktop)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            disabled={isCreatingKey}
          />
          <button
            className="account-button account-button--secondary"
            onClick={handleCreateKey}
            disabled={isCreatingKey || !newKeyName.trim()}
          >
            {isCreatingKey ? "Creating..." : "Create Key"}
          </button>
        </div>

        {/* Keys List */}
        <div className="api-keys-list">
          {isLoadingKeys ? (
            <p className="api-keys-list__empty">Loading...</p>
          ) : apiKeys.length === 0 ? (
            <p className="api-keys-list__empty">No API keys yet.</p>
          ) : (
            apiKeys.map((key) => (
              <div key={key.id} className="api-key-item">
                <div className="api-key-item__info">
                  <span className="api-key-item__name">{key.name}</span>
                  <code className="api-key-item__prefix">{key.keyPrefix}</code>
                  <span className="api-key-item__meta">
                    Created {formatDate(key.createdAt)}
                    {key.lastUsedAt &&
                      ` • Last used ${formatDate(key.lastUsedAt)}`}
                  </span>
                </div>
                <button
                  className="account-button account-button--danger api-key-item__delete"
                  onClick={() => handleDeleteKey(key.id)}
                  disabled={deletingKeyId === key.id}
                >
                  {deletingKeyId === key.id ? "..." : "Revoke"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="account-section">
        <h2 className="account-section__title">Session</h2>
        <div className="account-section__content">
          <button
            className="account-button account-button--secondary"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </section>
    </div>
  );
};
