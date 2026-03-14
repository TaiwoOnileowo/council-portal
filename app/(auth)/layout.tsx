import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: page content */}
      <div className="flex-1 overflow-y-auto max-w-[600px]">
        <div className="flex flex-col justify-center min-h-full px-16 py-12">
          {children}
        </div>
      </div>

      {/* Right: shared image panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <Image
          src="/gateimage.jpg"
          alt="Students on campus"
          fill
          className="object-cover"
          priority
        />

        <div className="z-10 flex flex-col items-center px-8">
          <p className="uppercase text-center font-bold auth-helper-text">
            CU STUDENT COUNCIL
          </p>
          <h1 className="auth-text max-w-2xl mt-2 font-bold uppercase text-center text-2xl md:text-4xl lg:text-5xl tracking-wide md:tracking-wider">
            MAKING YOUR CAMPUS LIFE EASIER
          </h1>
        </div>

        <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg z-10">
          <p className="font-heading font-semibold text-portal-text text-[15px]">
            Student Council
          </p>
          <p className="text-portal-accent text-sm">Covenant University</p>
        </div>
      </div>
    </div>
  );
}
