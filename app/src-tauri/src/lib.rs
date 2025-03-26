// SPDX-License-Identifier: MPL-2.0 

use std::path::{Path, PathBuf};

use errors::Error;
use serde::Serialize;

mod errors;
mod file;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_directory,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_directory(dir: &str) -> Result<Vec<FilePath>, Error> {
    let dir = Path::new(dir);
    match file::ls(&dir) {
        Ok(v) =>  {
            let paths: Vec<FilePath> = v
            .into_iter()
            .filter_map(|path| {
                let name = path.file_name()?
                    .to_str()?
                    .to_string();

                Some(FilePath {
                   name,
                   path 
                })
            })
            .collect();
        Ok(paths)
    }
        Err(e) => {
            println!("{}", e);
            Err(e).unwrap()
        }
    }
}

#[derive(Serialize )]
struct FilePath {
    name: String,
    path: PathBuf,
}
