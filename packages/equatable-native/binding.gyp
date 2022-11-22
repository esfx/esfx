{
    'variables' : {
        'openssl_fips': '',
    },
    "targets": [{
        "target_name": "<(module_name)",
        "sources": [ "src/hashCodeNative.cpp" ],
        "cflags": [ "-std=c++17", "-Wall" ],
        "cflags_cc": [ "-std=c++17" ],
        "conditions": [
            ['OS=="mac"', {
                "xcode_settings": {
                    "CLANG_CXX_LIBRARY": "libc++",
                    "CLANG_CXX_LANGUAGE_STANDARD":"c++17",
                }
            }],
            ['OS=="win"', {
                "msvs_settings": {
                    "VCCLCompilerTool": {
                        "AdditionalOptions": [ "-std:c++17", ],
                    },
                },
            }]
        ]
    }, {
        "target_name": "action_after_build",
        "type": "none",
        "dependencies": [ "<(module_name)" ],
        "copies": [
            {
                "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
                "destination": "<(module_path)"
            }
        ]
    }]
}
