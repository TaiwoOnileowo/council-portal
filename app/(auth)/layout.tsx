import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row lg:overflow-hidden bg-portal-accent-bg/50">
      <div className="lg:hidden relative h-36 sm:h-48 flex-shrink-0">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <Image
          src="/gateimage.jpg"
          alt="Covenant University campus"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center gap-1 px-6">
          <p className="text-white/75 font-semibold text-[11px] tracking-[0.25em] uppercase">
            CU Student Council
          </p>
          <p className="text-white font-bold text-lg sm:text-2xl tracking-wide uppercase text-center leading-tight">
            Making Your Campus Life Easier
          </p>
        </div>
      </div>

      <div className="flex-1 lg:max-w-[600px] overflow-y-auto">
        <div className="flex flex-col justify-center min-h-full px-5 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          <div className="w-full max-w-[480px] mx-auto lg:max-w-none lg:mx-0">
            {children}
          </div>
        </div>
      </div>

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
          <h1 className="auth-text max-w-2xl mt-2 font-bold uppercase text-center text-2xl xl:text-4xl 2xl:text-5xl tracking-wide xl:tracking-wider">
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
