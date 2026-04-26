// Dummy Firebase replacement since the system does not use Firebase
export const auth = {};
export const db = {};

export const signIn = async () => {
  console.log("Dummy sign in");
};

export const logOut = async () => {
  console.log("Dummy log out");
};
