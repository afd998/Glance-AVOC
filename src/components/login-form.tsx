import { cn } from "src/lib/utils"
import { Button } from "src/components/ui/button"
import { Input } from "src/components/ui/input"
import { Label } from "src/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "src/components/ui/input-otp"

interface LoginFormProps {
  className?: string;
  onSubmit: (e: React.FormEvent) => void;
  email: string;
  onEmailChange: (email: string) => void;
  isLoading: boolean;
  otpSent: boolean;
  otpCode: string;
  onOtpChange: (value: string) => void;
  onResendOtp?: () => void;
  onBackToEmail?: () => void;
  message: string;
  messageType: 'success' | 'error';
}

export function LoginForm({
  className,
  onSubmit,
  email,
  onEmailChange,
  isLoading,
  otpSent,
  otpCode,
  onOtpChange,
  onResendOtp,
  onBackToEmail,
  message,
  messageType,
}: LoginFormProps) {
  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={onSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {otpSent ? "Enter verification code" : "Login to your account"}
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          {otpSent 
            ? "We sent a 6-digit code to your email address"
            : "Enter your email below to login to your account"
          }
        </p>
      </div>
      
      <div className="grid gap-6">
        {!otpSent ? (
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required 
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={onOtpChange}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {message && (
          <div className={`text-sm p-3 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : otpSent ? "Verify Code" : "Send Code"}
        </Button>

        {otpSent && (
          <div className="flex flex-col gap-2 text-center">
            <button
              type="button"
              onClick={onResendOtp}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={onBackToEmail}
              className="text-sm text-muted-foreground hover:underline"
              disabled={isLoading}
            >
              Back to email
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
