import Image from "next/image";
import PageHeader from "@/components/ui/PageHeader";

type Props = {
  firstName: string;
  lastName: string;
  businessName: string;
  image: string | null;
};

export default function VendorDashboardHeader({
  firstName,
  lastName,
  businessName,
  image,
}: Props) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <PageHeader
      title={businessName}
      subtitle={`${firstName} ${lastName}`}
      avatar={
        image ? (
          <Image
            src={image}
            alt={businessName}
            width={44}
            height={44}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
            }}
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-[15px] font-extrabold text-blue-700 flex-shrink-0">
            {initials}
          </div>
        )
      }
    />
  );
}
