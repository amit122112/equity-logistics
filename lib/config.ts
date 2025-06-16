// Environment configuration with fallbacks and validation
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://hungryblogs.com/api",

  // Session Configuration
  sessionTimeout: Number.parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "120"), // minutes
  rememberMeDays: Number.parseInt(process.env.NEXT_PUBLIC_REMEMBER_ME_DAYS || "14"),
  enableSessionTimeout: process.env.NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT === "true",

  // App Configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Freight Calculator",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  enableLogs: process.env.NEXT_PUBLIC_ENABLE_LOGS === "true",
} as const

// Validation function to check if required environment variables are set
export const validateConfig = () => {
  const errors: string[] = []

  if (!process.env.NEXT_PUBLIC_API_URL) {
    errors.push("NEXT_PUBLIC_API_URL is required")
  }

  if (errors.length > 0) {
    console.error("❌ Environment Configuration Errors:")
    errors.forEach((error) => console.error(`  - ${error}`))
    console.error("\n📝 Please create a .env.local file with the required variables.")
    console.error("📖 See README.md for setup instructions.")
  } else {
    console.log("✅ Environment configuration is valid")
  }

  return errors.length === 0
}

// Development helper to show current config
export const logConfig = () => {
  if (config.enableLogs && typeof window !== "undefined") {
    console.log("🔧 App Configuration:", {
      apiUrl: config.apiUrl,
      sessionTimeout: `${config.sessionTimeout} minutes`,
      rememberMeDays: `${config.rememberMeDays} days`,
      enableSessionTimeout: config.enableSessionTimeout,
      appName: config.appName,
      appVersion: config.appVersion,
    })
  }
}
