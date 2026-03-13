import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

interface ButtonWithIconProps {
  text?: string;
  onClick?: () => void;
  className?: string;
}

const ButtonWithIcon = ({ text = "Start Testing Free", onClick, className }: ButtonWithIconProps) => {
  return (
    <Button
      onClick={onClick}
      className={`relative flex items-center justify-center text-sm font-medium rounded-full h-12 p-1 min-w-[200px] group transition-all duration-500 ease-in-out cursor-pointer ${className || ""}`}
    >
      <span className="relative z-10 block pr-6 group-hover:pr-10 group-hover:pl-4 transition-all duration-500 ease-in-out">
        {text}
      </span>
      <div className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 ease-in-out group-hover:right-[calc(100%_-_44px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </div>
    </Button>
  );
};

export default ButtonWithIcon;
