if (!process.env.NPM_CONFIG_OTP) {
    console.error("A one-time password is required for publish. Please set the 'NPM_CONFIG_OTP' environment variable before publishing.");
    process.exit(-1);
}