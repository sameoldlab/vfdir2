// SPDX-License-Identifier: MPL-2.0

// use serde_path_to_error::Error as SerdePathError;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Other(#[from] std::io::Error), // source and Display delegate to anyhow::Error
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
