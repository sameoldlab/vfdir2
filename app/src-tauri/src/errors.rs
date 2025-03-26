// SPDX-License-Identifier: MPL-2.0 

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Other(#[from] std::io::Error),  // source and Display delegate to anyhow::Error
}

