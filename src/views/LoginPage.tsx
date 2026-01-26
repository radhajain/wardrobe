import { SignIn } from "@clerk/nextjs";
import "./LoginPage.css";

export const LoginPage = () => {
  return (
    <div className="login-page">
      <h1 className="login-title">Wardrobe</h1>
      <SignIn
        appearance={{
          elements: {
            rootBox: "clerk-root",
            card: "clerk-card",
          },
        }}
        routing="hash"
        fallbackRedirectUrl="/pieces"
      />
    </div>
  );
};
