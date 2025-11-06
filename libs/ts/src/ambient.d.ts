declare module "@google-cloud/storage" {
  const Storage: any;
  export { Storage };
  export default Storage;
}

declare module "@google-cloud/secret-manager" {
  const SecretManagerServiceClient: any;
  export { SecretManagerServiceClient };
  export default SecretManagerServiceClient;
}
