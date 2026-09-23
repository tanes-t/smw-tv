# SMW-TV Android WebView Shell (APK Builder)

โฟลเดอร์นี้บรรจุโครงสร้างโปรเจกต์ **Android Studio** สำหรับนำไป Compile เป็นไฟล์ติดตั้ง **APK** เพื่อติดตั้งบนอุปกรณ์ Android TV & Google TV ในโรงงาน

---

## ฟีเจอร์ที่รวมอยู่ในโค้ด Android
1. **Full-screen Immersive Mode:** ซ่อนแถบนำทางและแถบสถานะของแอนดรอยด์ เพื่อให้แดชบอร์ดแสดงผลได้เต็มจอ 100%
2. **Auto-Start on Boot:** ทำงานร่วมกับ `BootReceiver` เพื่อตรวจสอบการเปิดเครื่องทีวี (หรือเมื่อไฟฟ้ากลับมาจ่ายเข้าจอหลังไฟดับ) และเรียกแอปขึ้นมาแสดงผลอัตโนมัติ
3. **Advanced WebView:** 
   - เปิดใช้งาน JavaScript
   - เปิดใช้งาน DomStorage (สำหรับแคชข้อมูล `localStorage` ของ API URL)
   - เปิดระบบ Zoom เพื่อจัดระดับความพอดีกับหน้าจอ
   - ปิดการเปิดหน้าต่างบราวเซอร์ภายนอก (ทุกอย่างรันภายในตัวแอปทั้งหมด)

---

## ขั้นตอนการสร้างไฟล์ติดตั้ง APK

### 1. การเตรียมความพร้อม
- ดาวน์โหลดและติดตั้ง [Android Studio](https://developer.android.com/studio) บนคอมพิวเตอร์ของคุณ
- ตรวจสอบให้แน่ใจว่าได้ติดตั้ง Android SDK (แนะนำ SDK 30 ขึ้นไป)
- โปรเจกต์นี้ใช้ Android Gradle Plugin 8.13 และ Gradle 8.13 ซึ่งต้องใช้ **Gradle JDK 21**
- ใน Android Studio ไปที่ **File > Settings > Build, Execution, Deployment > Build Tools > Gradle**
  แล้วตั้ง **Gradle JDK** เป็น JDK 21 ที่ติดตั้งสมบูรณ์
  (ห้ามเลือก JDK 25 เพราะ Gradle 8.13 ยังไม่รองรับ)
- ตรวจสอบ JDK ที่เลือกด้วย `java -version` ต้องแสดง `21.x` และโฟลเดอร์ JDK ต้องมีไฟล์ `lib\jvm.cfg`
- หาก `Embedded JDK/jbr-21` ไม่มี `lib\jvm.cfg` ให้ติดตั้ง JDK 21 ใหม่ เช่น Eclipse Temurin 21 แล้วเลือกโฟลเดอร์ JDK นั้นแทน

### 2. นำเข้าโปรเจกต์ (Import Project)
1. เปิดโปรเจกต์ Android Studio
2. เลือก **Open an Existing Project**
3. ชี้ตำแหน่งไปที่โฟลเดอร์: `D:\SynologyDrive2\SynologyDrive\Information Technology\Documents\WebSystem\SMW-TV\android-webview-shell`
4. รอให้ Gradle โหลดโครงสร้างโปรเจกต์และดาวน์โหลด Dependency สำเร็จ

### 3. การคัดลอกไฟล์หน้าจอ React TV เข้าไปในแอป (React TV Bundle)
เพื่อให้แอปทำงานได้เร็วเสมือนแอปแบบ Native (เช่น Netflix) ไฟล์การแสดงผลทั้งหมดจะถูกฝังไว้ในตัว APK โดยไม่ต้องดึงหน้าเว็บจากเน็ตทุกครั้ง:
1. เปิด Command Line ในโฟลเดอร์หลัก `SMW-TV` แล้วทำการรันคำสั่ง:
   ```bash
   npm run build
   ```
2. โครงการจะสร้างโฟลเดอร์ `dist/` ขึ้นมา
3. ให้ก๊อปปี้ไฟล์และโฟลเดอร์ทั้งหมดด้านในโฟลเดอร์ `dist/` ไปวางในโฟลเดอร์ทรัพย์สินของแอปแอนดรอยด์ที่:
   `D:\SynologyDrive2\SynologyDrive\Information Technology\Documents\WebSystem\SMW-TV\android-webview-shell\app\src\main\assets\`  
   *(หากยังไม่มีโฟลเดอร์ `assets` ให้คลิกขวาที่โฟลเดอร์ `main` ใน Android Studio แล้วเลือก New > Folder > Assets Folder หรือสร้างโฟลเดอร์ชื่อ `assets` ตรงๆ ได้เลย)*

### 4. การกำหนดลิงก์เริ่มต้น (Default URL Setup)
หากต้องการเปลี่ยนลิงก์เริ่มต้นที่แอปจะเปิดตอนติดตั้งครั้งแรก:
- เปิดไฟล์ `app/src/main/java/com/siammetalwork/smwtv/MainActivity.java`
- ค้นหาตัวแปร `DEFAULT_URL` และทำการระบุลิงก์เว็บแอปหรือช่องทางจำลองที่ต้องการใช้งาน (ค่าเริ่มต้นจะชี้ไปที่ไฟล์ภายในตัวเครื่อง `file:///android_asset/index.html` เรียบร้อยแล้ว)

### 5. การ Compile เพื่อนำออกไฟล์ติดตั้ง (Generate APK)
1. ไปที่แถบเมนูด้านบนเลือก **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
2. รอจนเสร็จสิ้น (จะมีหน้าต่างป๊อปอัปเด้งแจ้งเตือนที่มุมขวาล่าง)
3. กดปุ่ม **Locate** เพื่อเปิดโฟลเดอร์เก็บไฟล์ `app-debug.apk`
4. ทำการก๊อปปี้ไฟล์ `.apk` ดังกล่าวลงแฟลชไดรฟ์ (USB) แล้วนำไปติดตั้งบน Android TV ของคุณ

### 6. ทดสอบบน Android TV/Emulator
1. เชื่อมต่อ Android TV หรือเปิด Android TV Emulator และเปิด **USB debugging**
2. ใน Android Studio เลือกอุปกรณ์จากแถบ Device แล้วกด **Run 'app'**
3. หากต้องการติดตั้ง APK ด้วยคำสั่ง ให้ใช้:
   ```powershell
   adb install -r app\build\outputs\apk\debug\app-debug.apk
   ```
4. หาก Android Studio แสดง `Incompatible Gradle JVM version` ให้กลับไปตั้ง **Gradle JDK เป็น Java 21** ตามข้อ 1 แล้วกด **Sync Project with Gradle Files** ใหม่
