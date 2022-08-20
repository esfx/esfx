{
    "targets": [{
        "target_name": "native",
        "sources": ["src/internal/hashCode.cpp"],
        "conditions": [
            ['OS=="linux"', {
                "cflags": [ "-std=c++11", "-Wall" ]
            }, {
                "cflags": [ "-std=c++11", "-stdlib=libc++", "-Wall" ]
            }]
        ]
    }]
}