# Keep kotlinx.serialization generated serializers for the shared core models.
-keepclassmembers class com.abertech.srportal.core.** {
    *** Companion;
}
-keepclasseswithmembers class com.abertech.srportal.core.** {
    kotlinx.serialization.KSerializer serializer(...);
}
