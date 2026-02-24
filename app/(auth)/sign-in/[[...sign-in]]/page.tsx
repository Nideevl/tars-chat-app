import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center relative"
         style={{ background: "transparent" }}>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
              <img src="./horLogo.png" className="h-10"/>
            </div>
          <p className="-ml-2 mt-1 text-xl" style={{ color: "rgb(245,245,245,0.6)" }}>
            Real-time messaging, simplified.
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}