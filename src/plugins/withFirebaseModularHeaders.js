const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add modular headers for Firebase compatibility
 */
const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');
      
      // Check if already modified
      if (podfileContent.includes('# Firebase modular headers')) {
        return config;
      }
      
      // Add modular headers configuration after prepare_react_native_project!
      const modularHeadersConfig = `
# Firebase modular headers for Swift compatibility
pod 'GoogleUtilities', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreInternal', :modular_headers => true
pod 'FirebaseInstallations', :modular_headers => true
pod 'GoogleDataTransport', :modular_headers => true
pod 'nanopb', :modular_headers => true
`;
      
      // Insert after use_expo_modules!
      podfileContent = podfileContent.replace(
        'use_expo_modules!',
        `use_expo_modules!\n${modularHeadersConfig}`
      );
      
      fs.writeFileSync(podfilePath, podfileContent);
      
      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
