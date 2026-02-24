import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center relative"
         style={{ background: "transparent" }}>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className=" mt-9 mb-3 text-center">
          <div className="mb-4 flex justify-center">
<img src="./horLogo.png" className="h-10"/>
</div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Join and start messaging in seconds.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}