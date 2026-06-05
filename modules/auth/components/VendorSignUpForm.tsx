"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpVendor, checkVendorApproval } from "@/lib/actions/vendor.action";
import {
  vendorSignUpSchema,
  type VendorSignUpInput,
} from "@/modules/vendor/vendor.types";
import { useBanks } from "@/modules/vendor/hooks/useBanks";
import StepIndicator from "./StepIndicator";
import CredentialsStep from "./vendor-signup/CredentialsStep";
import ProfileInfoStep from "./vendor-signup/ProfileInfoStep";
import BankStep, { type BankFields } from "./vendor-signup/BankStep";
import CommissionStep from "./vendor-signup/CommissionStep";
import UnapprovedScreen from "./vendor-signup/UnapprovedScreen";

const step1Fields = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
  "confirmPassword",
] as const;

const step2Fields = [
  "transportName",
  "tagline",
  "description",
  "tiktok",
  "instagram",
] as const;

export default function VendorSignUpForm() {
  const router = useRouter();

  useBanks();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [unapproved, setUnapproved] = useState(false);
  const [image, setImage] = useState("");
  const [bank, setBank] = useState<BankFields>({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  const methods = useForm<VendorSignUpInput>({
    resolver: zodResolver(vendorSignUpSchema),
    mode: "onTouched",
  });

  async function handleStep1(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!(await methods.trigger(step1Fields))) return;

    setChecking(true);
    try {
      const { approved } = await checkVendorApproval(methods.getValues("email"));
      if (!approved) {
        setUnapproved(true);
        return;
      }
      setStep(2);
    } catch {
      toast.error("Could not verify email. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleStep2(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await methods.trigger(step2Fields)) setStep(3);
  }

  async function handleFinalSubmit() {
    setLoading(true);
    try {
      const result = await signUpVendor({
        ...methods.getValues(),
        image: image || undefined,
        bankCode: bank.bankCode,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Account created successfully!");
      router.push("/vendor-dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (unapproved) {
    return (
      <div className="space-y-5">
        <StepIndicator step={1} totalSteps={4} />
        <UnapprovedScreen
          email={methods.getValues("email")}
          onBack={() => setUnapproved(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StepIndicator step={step} totalSteps={4} />

      <FormProvider {...methods}>
        {step === 1 && (
          <CredentialsStep onSubmit={handleStep1} checking={checking} />
        )}

        {step === 2 && (
          <ProfileInfoStep
            image={image}
            onImageChange={setImage}
            onSubmit={handleStep2}
            onBack={() => setStep(1)}
          />
        )}
      </FormProvider>

      {step === 3 && (
        <BankStep
          value={bank}
          onChange={setBank}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <CommissionStep
          onBack={() => setStep(3)}
          onAccept={handleFinalSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
