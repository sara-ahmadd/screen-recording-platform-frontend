import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
  withText?: boolean;
  textClassName?: string;
};

export default function Logo({
  className,
  imageClassName,
  alt = "theRec logo",
  withText = false,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoImage}
        alt={alt}
        className={cn("h-auto w-[200px] object-cover", imageClassName)}
      />
    </div>
  );
}
