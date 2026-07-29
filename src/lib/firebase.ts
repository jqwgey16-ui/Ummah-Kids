import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase client
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Helper to upload an image to Firebase Storage and return its public URL
 * @param file The file object to upload
 * @param path The path in storage (e.g., 'covers')
 * @returns Promise with the public download URL
 */
export async function uploadImageToStorage(file: File, path: string = "covers"): Promise<string> {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        console.error("Storage upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
export type { FirebaseUser };
