if (!process.env.NPM_CONFIG_OTP) {
    console.error("A one-time password is required for publish. Please set the 'NPM_CONFIG_OTP' environment variable or use 'npm run lerna-publish -- --otp=<your otp>' to publish.");
    process.exit(-1);
}