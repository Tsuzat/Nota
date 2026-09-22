use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    {
        // Add rpaths so dyld resolves @rpath/libappleai.dylib both in dev (cargo run / tauri dev)
        // and in bundled macOS app (.app/Contents/MacOS/app).
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path");
        println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Frameworks");
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources");
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources/resources");

        let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
        let resources_dylib = manifest_dir.join("resources").join("libappleai.dylib");

        let source_dylib = if resources_dylib.exists() {
            Some(resources_dylib.clone())
        } else {
            find_crate_prebuilt_dylib()
        };

        if let Some(src) = source_dylib {
            // Ensure src-tauri/resources/libappleai.dylib exists for tauri.conf.json bundle.resources
            let target_resources = manifest_dir.join("resources");
            let _ = fs::create_dir_all(&target_resources);
            let dest_in_resources = target_resources.join("libappleai.dylib");
            if src != dest_in_resources && !dest_in_resources.exists() {
                let _ = fs::copy(&src, &dest_in_resources);
            }

            // Also copy to OUT_DIR ancestors (target/debug or target/release) and deps
            if let Ok(out_dir) = env::var("OUT_DIR") {
                let out_path = PathBuf::from(out_dir);
                if let Some(target_dir) = out_path.ancestors().nth(3) {
                    let _ = fs::copy(&src, target_dir.join("libappleai.dylib"));
                    let deps_dir = target_dir.join("deps");
                    if deps_dir.exists() {
                        let _ = fs::copy(&src, deps_dir.join("libappleai.dylib"));
                    }
                }
            }
        }
    }

    tauri_build::build();
}

#[cfg(all(target_os = "macos", target_arch = "aarch64"))]
fn find_crate_prebuilt_dylib() -> Option<PathBuf> {
    let home = env::var("HOME").ok()?;
    let cargo_registry = PathBuf::from(home).join(".cargo/registry/src");
    let entries = fs::read_dir(cargo_registry).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir()
            && path
                .file_name()
                .map_or(false, |n| n.to_string_lossy().starts_with("index.crates.io-"))
        {
            if let Ok(crates) = fs::read_dir(&path) {
                for krate in crates.flatten() {
                    let krate_path = krate.path();
                    if krate_path
                        .file_name()
                        .map_or(false, |n| n.to_string_lossy().starts_with("tauri-apple-intelligence-"))
                    {
                        let dylib = krate_path.join("prebuilt").join("libappleai.dylib");
                        if dylib.exists() {
                            return Some(dylib);
                        }
                    }
                }
            }
        }
    }
    None
}
