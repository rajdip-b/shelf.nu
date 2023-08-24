import { useState } from "react";
import type { InputProps } from "./input";
import Input from "./input";
import { EyeIcon, EyeOffIcon } from "../icons";

export default function PasswordInput(props: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className="relative">
      <Input {...props} type={showPassword ? "text" : "password"} />
      <span
        className="absolute bottom-2 right-[14px] flex h-6 w-[20px] cursor-pointer flex-col items-end justify-center text-gray-500"
        onClick={togglePasswordVisibility}
      >
        {showPassword ? (
          <EyeOffIcon className="h-full w-full" />
        ) : (
          <EyeIcon className="h-full w-full" />
        )}
      </span>
    </div>
  );
}
