import React, { useRef, useState, useEffect } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import NepaliDate from "nepali-date-converter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Form.css";
import * as Slider from "@radix-ui/react-slider";
import "./slider.css";
import api from "../api";
import { useTranslation } from "react-i18next";

const TOTAL_STEPS = 10;

type FormData = {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  dateOfBirthBS: string;
  gender: string;
  genderOther?: string;
  nationality: string;
  nationalityOther?: string;
  citizenshipNumber: string;
  citizenshipIssueDate: string;
  citizenshipIssueDateBS: string;
  citizenshipIssueDistrict: string;
  beneficiaryIdNo: string;
  panNumber: string;
  identificationNo: string;
  identificationAddress: string;

  // Address Information
  currentWardNo: string;
  currentMunicipality: string;
  currentDistrict: string;
  currentProvince: string;
  currentCountry: string;
  permanentWardNo: string;
  permanentMunicipality: string;
  permanentDistrict: string;
  permanentProvince: string;
  permanentCountry: string;
  contactNumber: string;
  emailAddress: string;

  // Family Information
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  grandfatherName: string;
  fatherInLawName: string;
  motherInLawName: string;
  spouseName: string;
  childrenNames: string[];

  // Bank Details
  accountType: string;
  bankAccount: string;
  bankName: string;
  bankAddress: string;

  // Occupation & Finance
  occupationType: string;
  occupationOther?: string;
  businessType: string;
  businessTypeOther?: string;
  organizationName: string;
  organizationAddress: string;
  designation: string;
  employeeId: string;
  annualIncome: number;

  // Guardian Information
  isMinor: boolean;
  guardianName: string;
  relationship: string;
  guardianWardNo: string;
  guardianMunicipality: string;
  guardianDistrict: string;
  guardianProvince: string;
  guardianCountry: string;
  mobileNumber: string;
  email: string;
  panNumberGuardian: string;
  birthRegistrationNumber: string;
  issueDate: string;
  issueDateBS: string;
  issueAuthority: string;
  guardianSignature: string;

  // Legal & Investment
  investmentInvolved: boolean;
  investmentDetails: string;
  legalDeclaration: string;
  legalConsent: boolean;

  // Thumbprints
  rightThumbprint: string;
  leftThumbprint: string;

  // Location
  latitude: number;
  longitude: number;
  // Documents
  citizenshipFrontImage: string;
  citizenshipBackImage: string;
  passportImage?: string;
  photoImage: string;
  panCardImage?: string;
  birthCertificateImage?: string; // For minors

  guardianCitizenshipImage?: string; // For minors
  guardianPhotoImage?: string; // For minors
  fingerprintImage?: string;
  locationMapImage?: string;
};

function Form() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [mapPosition, setMapPosition] = useState<LatLngTuple>([
    27.7172, 85.324,
  ]);

  // React Hook Form setup
  const methods = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      fullName: "",
      isMinor: false,
      investmentInvolved: false,
      legalConsent: false,
      latitude: 27.7172,
      longitude: 85.324,
      maritalStatus: "",
      fatherInLawName: "",
      motherInLawName: "",
      childrenNames: [],
      guardianWardNo: "",
      guardianMunicipality: "",
      guardianDistrict: "",
      guardianProvince: "",
      guardianCountry: "",
    },
    mode: "onChange",
  });
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Initialize KYC session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await api.post("/api/KycSession/initialize", {
          email: "temp@example.com", // You can make this dynamic later
          mobileNo: "9800000000",
          ipAddress: null,
          userAgent: navigator.userAgent,
          deviceFingerprint: null,
        });

        const data = response.data;
        setSessionId(data.sessionId);
        localStorage.setItem("kycSessionId", data.sessionId.toString());
        localStorage.setItem("kycSessionToken", data.sessionToken);
        setSessionReady(true);
        console.log("✅ KYC Session initialized:", data.sessionId);
      } catch (error) {
        console.error("❌ Failed to initialize session:", error);
        alert("Failed to start KYC session. Please refresh the page.");
      }
    };

    // Check if session already exists in localStorage
    const existingSessionId = localStorage.getItem("kycSessionId");
    if (existingSessionId) {
      setSessionId(parseInt(existingSessionId));
      setSessionReady(true);
    } else {
      initializeSession();
    }
  }, []);
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = methods;

  // Watch values for conditional rendering
  const isMinor = watch("isMinor");
  const investmentInvolved = watch("investmentInvolved");
  const currentAddress = getValues([
    "currentWardNo",
    "currentMunicipality",
    "currentDistrict",
    "currentProvince",
    "currentCountry",
  ]);

  /* -------------------- DATE CONVERSION -------------------- */
  const adToBs = (ad: string) => {
    try {
      const [y, m, d] = ad.split("-").map(Number);
      const nep = new NepaliDate(new Date(y, m - 1, d));
      return `${nep.getYear()}-${String(nep.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(nep.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const bsToAd = (bs: string) => {
    try {
      const [y, m, d] = bs.split("-").map(Number);
      const nep = new NepaliDate(y, m - 1, d);
      const ad = nep.getAD();
      return `${ad.year}-${String(ad.month).padStart(2, "0")}-${String(
        ad.date
      ).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  /* -------------------- SIGNATURES -------------------- */
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const rightThumb = useRef<SignatureCanvas | null>(null);
  const leftThumb = useRef<SignatureCanvas | null>(null);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setValue("guardianSignature", "");
  };

  const clearRightThumbprint = () => {
    rightThumb.current?.clear();
    setValue("rightThumbprint", "");
  };

  const clearLeftThumbprint = () => {
    leftThumb.current?.clear();
    setValue("leftThumbprint", "");
  };

  const saveSignature = () => {
    const signature = sigCanvas.current?.toDataURL() ?? "";
    setValue("guardianSignature", signature);
  };

  const saveRightThumbprint = () => {
    const thumbprint = rightThumb.current?.toDataURL() ?? "";
    setValue("rightThumbprint", thumbprint);
  };

  const saveLeftThumbprint = () => {
    const thumbprint = leftThumb.current?.toDataURL() ?? "";
    setValue("leftThumbprint", thumbprint);
  };

  /* -------------------- MAP -------------------- */
  /* -------------------- MAP -------------------- */
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  L.Marker.prototype.options.icon = DefaultIcon;

  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        setMapPosition([e.latlng.lat, e.latlng.lng]);
        setValue("latitude", e.latlng.lat);
        setValue("longitude", e.latlng.lng);
      },
    });
    return null; // Change this to null instead of returning Marker
  };

  /* -------------------- NAVIGATION -------------------- */
  //   const handleNext = async () => {
  //         const stepFields = getStepFields(currentStep);
  //         const isValid = await trigger(stepFields);

  //         if (isValid && currentStep < TOTAL_STEPS) {
  //           setCurrentStep((s) => s + 1);
  //         }
  //       };

  //       const handlePrevious = () => {
  //         if (currentStep > 1) {
  //           setCurrentStep((s) => s - 1);
  //         }
  //       };

  const handleNext = async () => {
    if (currentStep < totalStepsCount) {
      let nextStep = currentStep + 1;
      // Skip Step 6 (Guardian Info) if user is 18 or older
      if (userAge !== null && userAge >= 18 && nextStep === 6) {
        nextStep = 7;
      }
      setCurrentStep(nextStep);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 1) {
      let prevStep = currentStep - 1;
      // Skip Step 6 (Guardian Info) when going back if user is 18 or older
      if (userAge !== null && userAge >= 18 && prevStep === 6) {
        prevStep = 5;
      }
      setCurrentStep(prevStep);
    }
  };
  const onSubmit = async (data: FormData) => {
    if (currentStep !== totalStepsCount - 1) return;

    try {
      const payload = {
        personalInfo: {
          fullName: data.fullName,
          dobAd: new Date(data.dateOfBirth),
          dobBs: data.dateOfBirthBS,
          gender: data.gender,
          nationality: data.nationality,
          citizenshipNo: data.citizenshipNumber,
          citizenshipIssueDate: data.citizenshipIssueDate,
          citizenshipIssueDistrict: data.citizenshipIssueDistrict,
          panNo: data.panNumber || "",
        },
        currentAddress: {
          municipality: data.currentMunicipality,
          district: data.currentDistrict,
          province: data.currentProvince,
          country: data.currentCountry,
          wardNo: data.currentWardNo,
          contactNumber: data.contactNumber,
          email: data.emailAddress,
        },
        permanentAddress: {
          municipality: data.permanentMunicipality,
          district: data.permanentDistrict,
          province: data.permanentProvince,
          country: data.permanentCountry,
          wardNo: data.permanentWardNo,
        },
        family: {
          fatherName: data.fatherName,
          motherName: data.motherName,
          grandfatherName: data.grandfatherName,
          spouseName: data.spouseName || "",
          childrenNames: data.childrenNames?.join(", ") || "",
          fatherInLawName: data.fatherInLawName || "",
          motherInLawName: data.motherInLawName || "",
          maritalStatus: data.maritalStatus,
        },
        bank: {
          accountType: data.accountType,
          accountNumber: data.bankAccount,
          bankName: data.bankName,
          bankAddress: data.bankAddress,
        },
        occupation: {
          occupation:
            data.occupationType === "Other"
              ? data.occupationOther
              : data.occupationType,
          orgName: data.organizationName || "",
          orgAddress: data.organizationAddress || "",
          designation: data.designation || "",
          employeeIdNo: data.employeeId || "",
          annualIncomeBracket: getIncomeRange(data.annualIncome),
          businessType: data.businessType,
        },
        guardian: isMinorByAge
          ? {
              guardianName: data.guardianName,
              relationship: data.relationship,
              wardNo: data.guardianWardNo,
              municipality: data.guardianMunicipality,
              district: data.guardianDistrict,
              province: data.guardianProvince,
              country: data.guardianCountry,
              mobileNumber: data.mobileNumber,
              email: data.email,
              panNumber: data.panNumberGuardian || "",
              birthRegistrationNumber: data.birthRegistrationNumber,
              issueDate: data.issueDate,
              issueAuthority: data.issueAuthority,
              signature: data.guardianSignature || "",
            }
          : null,
        legal: {
          declaration: data.legalDeclaration || "",
          consent: data.legalConsent || false,
        },
        biometrics: {
          rightThumbprint: data.rightThumbprint || "",
          leftThumbprint: data.leftThumbprint || "",
          guardianSignature: data.guardianSignature || "",
        },
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      };

      // Replace this endpoint with your final "submit" API if different
      await api.post("/api/KycData/submit", payload);

      console.log("✅ KYC submitted successfully");
      setSubmittedData(data);
      setCurrentStep(totalStepsCount);
      alert("✅ KYC form submitted successfully!");
    } catch (error: any) {
      console.error("❌ Error:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Submission failed";
      alert(`❌ ${errorMsg}`);
    }
  };
  // Helper function to convert annual income number to range string
  const getIncomeRange = (income: number): string => {
    if (income <= 500000) {
      return "Up to Rs. 5,00,000";
    } else if (income <= 1000000) {
      return "From Rs. 5,00,001 to Rs. 10,00,000";
    } else {
      return "Above Rs. 10,00,000";
    }
  };
  useEffect(() => {
    const sub = methods.watch((values) => {
      localStorage.setItem("kycDraftValues", JSON.stringify(values));
    });
    return () => sub.unsubscribe();
  }, [methods]);

  /*-------------for other field---------*/
  const occupationType = watch("occupationType");
  const businessType = watch("businessType");

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const dateOfBirth = watch("dateOfBirth");
  const userAge = calculateAge(dateOfBirth);
  const isMinorByAge = userAge !== null && userAge < 18;

  // Calculate total steps based on age
  const getTotalSteps = () => {
    if (userAge !== null && userAge >= 18) {
      return 9; // Skip guardian info step
    }
    return 10; // Include guardian info step
  };
  const { t, i18n } = useTranslation();
  const totalStepsCount = getTotalSteps();
  /* -------------------- STEP VALIDATION FIELDS -------------------- */
  const getStepFields = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 1:
        return [
          "firstName",
          "lastName",
          "fullName",
          "dateOfBirth",
          "gender",
          "nationality",
          "citizenshipNumber",
          "citizenshipIssueDate",
          "citizenshipIssueDistrict",
        ];
      case 2:
        return [
          "currentWardNo",
          "currentMunicipality",
          "currentDistrict",
          "currentProvince",
          "currentCountry",
          "permanentWardNo",
          "permanentMunicipality",
          "permanentDistrict",
          "permanentProvince",
          "permanentCountry",
          "contactNumber",
          "emailAddress",
        ];
      case 3: {
        const step3Fields: (keyof FormData)[] = [
          "maritalStatus",
          "fatherName",
          "motherName",
          "grandfatherName",
        ];
        const gender = watch("gender");
        const maritalStatus = watch("maritalStatus");
        if (gender === "Female" && maritalStatus === "Married") {
          step3Fields.push("fatherInLawName", "motherInLawName");
        }
        return step3Fields;
      }
      case 4:
        return ["accountType", "bankAccount", "bankName", "bankAddress"];
      case 5: {
        const step5Fields: (keyof FormData)[] = [
          "occupationType",
          "businessType",
          "organizationName",
          "organizationAddress",
          "designation",
          "employeeId",
          "annualIncome",
        ];
        if (occupationType === "Other") {
          step5Fields.push("occupationOther");
        }
        return step5Fields;
      }
      case 6:
        return isMinor
          ? [
              "guardianName",
              "relationship",
              "guardianWardNo",
              "guardianMunicipality",
              "guardianDistrict",
              "guardianProvince",
              "guardianCountry",
              "mobileNumber",
              "email",
              "birthRegistrationNumber",
              "issueDate",
              "issueAuthority",
            ]
          : [];
      case 7:
        return ["legalConsent"];
      case 8:
        // Document upload validation
        const docFields: (keyof FormData)[] = [
          "citizenshipFrontImage",
          "citizenshipBackImage",
          "photoImage",
        ];
        if (isMinorByAge) {
          docFields.push(
            "birthCertificateImage",
            "guardianCitizenshipImage",
            "guardianPhotoImage"
          );
        }
        return docFields;
      case 9:
        return [];
      default:
        return [];
    }
  };
  const captureMapScreenshot = async () => {
    try {
      // Use html2canvas to capture the map
      const mapElement = document.querySelector(
        ".leaflet-container"
      ) as HTMLElement;
      if (!mapElement) {
        alert("Map not found!");
        return;
      }

      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `location-map-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          alert("✅ Map screenshot saved successfully!");
        }
      });
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      alert("❌ Failed to capture screenshot. Please try again.");
    }
  };

  /* -------------------- STEP RENDERER -------------------- */
  const renderStep = () => {
    // Skip Step 6 (Guardian Info) if user is 18 or older
    let displayStep = currentStep;
    if (userAge !== null && userAge >= 18 && currentStep >= 6) {
      displayStep = currentStep + 1;
    }

    switch (displayStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      case 9:
        return renderStep9();
      case 10:
        return renderConfirmationPage();
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <div className="form-section">
      <h2 className="section-title">{t("step1.title")}</h2>

      {/* First Name, Middle Name, Last Name */}
      <div className="form-field">
        <label className="form-label">
          {t("step1.firstName")} <span className="required">*</span>
        </label>
        <Controller
          name="firstName"
          control={control}
          rules={{ required: "First name is required" }}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="form-input"
              placeholder={t("step1.firstNamePlaceholder")}
              onChange={(e) => {
                field.onChange(e);
                // Update fullName
                const firstName = e.target.value;
                const middleName = getValues("middleName") || "";
                const lastName = getValues("lastName") || "";
                setValue(
                  "fullName",
                  `${firstName} ${middleName} ${lastName}`.trim()
                );
              }}
            />
          )}
        />
        {errors.firstName && (
          <p className="error-message">{errors.firstName.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">{t("step1.middleName")}</label>
        <Controller
          name="middleName"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="form-input"
              placeholder={t("step1.middleNamePlaceholder")}
              onChange={(e) => {
                field.onChange(e);
                // Update fullName
                const firstName = getValues("firstName") || "";
                const middleName = e.target.value;
                const lastName = getValues("lastName") || "";
                setValue(
                  "fullName",
                  `${firstName} ${middleName} ${lastName}`.trim()
                );
              }}
            />
          )}
        />
      </div>

      <div className="form-field">
        <label className="form-label">
          {t("step1.lastName")} <span className="required">*</span>
        </label>
        <Controller
          name="lastName"
          control={control}
          rules={{ required: "Last name is required" }}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="form-input"
              placeholder={t("step1.lastNamePlaceholder")}
              onChange={(e) => {
                field.onChange(e);
                // Update fullName
                const firstName = getValues("firstName") || "";
                const middleName = getValues("middleName") || "";
                const lastName = e.target.value;
                setValue(
                  "fullName",
                  `${firstName} ${middleName} ${lastName}`.trim()
                );
              }}
            />
          )}
        />
        {errors.lastName && (
          <p className="error-message">{errors.lastName.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          {t("step1.dateOfBirth")}
          <span className="required">*</span>
        </label>
        <div className="grid-2-cols">
          <div className="date-column">
            <label className="small-label">
              {t("step1.dateOfBirthAD")} (AD)
            </label>
            <Controller
              name="dateOfBirth"
              control={control}
              rules={{
                required: "Date of birth is required",
                validate: (v) =>
                  !v || v <= todayStr || "Date cannot be in the future",
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  max={todayStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v);
                    if (v) {
                      const bs = adToBs(v);
                      if (bs) setValue("dateOfBirthBS", bs);
                    }
                  }}
                  className="form-input"
                />
              )}
            />
          </div>

          <div className="date-column">
            <label className="small-label">{t("step1.dateOfBirthBS")}</label>
            <Controller
              name="dateOfBirthBS"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                      const ad = bsToAd(value);
                      if (ad) setValue("dateOfBirth", ad);
                    }
                  }}
                  className="form-input"
                />
              )}
            />
          </div>
        </div>
        {errors.dateOfBirth && (
          <p className="error-message">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          {t("step1.gender")}
          <span className="required">*</span>
        </label>

        <Controller
          name="gender"
          control={control}
          rules={{ required: "Please select your gender" }}
          render={({ field }) => (
            <div className="gender-radio-group">
              {/* Male */}
              <div
                className={`gender-option ${
                  field.value === "Male" ? "selected" : ""
                }`}
                onClick={() => field.onChange("Male")}
              >
                <input
                  type="radio"
                  id="male"
                  name="gender"
                  checked={field.value === "Male"}
                  onChange={() => {}}
                  className="gender-radio-input"
                />
                <div className="gender-icon-container">
                  <span className="material-icons male-icon">male</span>
                </div>
                <label htmlFor="male" className="gender-label">
                  {t("step1.gender.male")}
                </label>
              </div>

              {/* Female */}
              <div
                className={`gender-option ${
                  field.value === "Female" ? "selected" : ""
                }`}
                onClick={() => field.onChange("Female")}
              >
                <input
                  type="radio"
                  id="female"
                  name="gender"
                  checked={field.value === "Female"}
                  onChange={() => {}}
                  className="gender-radio-input"
                />
                <div className="gender-icon-container">
                  <span className="material-icons female-icon">female</span>
                </div>
                <label htmlFor="female" className="gender-label">
                  {t("step1.gender.female")}
                </label>
              </div>

              {/* Other */}
              <div
                className={`gender-option ${
                  field.value === "Other" ? "selected" : ""
                }`}
                onClick={() => field.onChange("Other")}
              >
                <input
                  type="radio"
                  id="other"
                  name="gender"
                  checked={field.value === "Other"}
                  onChange={() => {}}
                  className="gender-radio-input"
                />
                <div className="gender-icon-container">
                  <span className="material-icons other-icon">transgender</span>
                </div>
                <label htmlFor="other" className="gender-label">
                  {t("step1.gender.other")}
                </label>
              </div>
            </div>
          )}
        />

        {errors.gender && (
          <p className="error-message">{errors.gender.message}</p>
        )}
      </div>

      {/* Conditional "Other" gender specification field */}
      {watch("gender") === "Other" && (
        <div className="form-field">
          <label className="form-label">
            {t("step1.genderOther")} <span className="required">*</span>
          </label>
          <Controller
            name="genderOther"
            control={control}
            rules={{
              required:
                watch("gender") === "Other"
                  ? "Please specify your gender"
                  : false,
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="form-input"
                placeholder="Enter your gender"
              />
            )}
          />
          {errors.genderOther && (
            <p className="error-message">{errors.genderOther.message}</p>
          )}
        </div>
      )}
      <div className="form-field">
        <label className="form-label">
          {t("step1.nationality")} <span className="required">*</span>
        </label>
        <Controller
          name="nationality"
          control={control}
          rules={{ required: "Nationality is required" }}
          render={({ field }) => (
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="nepali"
                  value="Nepali"
                  checked={field.value === "Nepali"}
                  onChange={() => {
                    field.onChange("Nepali");
                    setValue("nationalityOther", ""); // Clear other field
                  }}
                  className="radio-input"
                />
                <label htmlFor="nepali" className="radio-label">
                  {t("step1.nationality.nepali")}
                </label>
              </div>

              <div className="radio-option">
                <input
                  type="radio"
                  id="nationality-other"
                  value="Other"
                  checked={field.value === "Other"}
                  onChange={() => field.onChange("Other")}
                  className="radio-input"
                />
                <label htmlFor="nationality-other" className="radio-label">
                  {t("step1.nationality.other")}
                </label>
              </div>
            </div>
          )}
        />
        {errors.nationality && (
          <p className="error-message">{errors.nationality.message}</p>
        )}
      </div>

      {/* Conditional "Other" nationality specification field */}
      {watch("nationality") === "Other" && (
        <div className="form-field">
          <label className="form-label">
            {t("step1.nationalityOther")}
            <span className="required">*</span>
          </label>
          <Controller
            name="nationalityOther"
            control={control}
            rules={{
              required:
                watch("nationality") === "Other"
                  ? "Please specify your nationality"
                  : false,
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="form-input"
                placeholder="Enter your nationality"
              />
            )}
          />
          {errors.nationalityOther && (
            <p className="error-message">{errors.nationalityOther.message}</p>
          )}
        </div>
      )}

      <div className="form-field">
        <label className="form-label">
          {t("step1.citizenshipNumber")} <span className="required">*</span>
        </label>
        <Controller
          name="citizenshipNumber"
          control={control}
          rules={{ required: "Citizenship number is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.citizenshipNumber && (
          <p className="error-message">{errors.citizenshipNumber.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          {t("step1.citizenshipIssueDate")} <span className="required">*</span>
        </label>
        <div className="grid-2-cols">
          <div className="date-column">
            <label className="small-label">{t("step1.dateOfBirthAD")}</label>
            <Controller
              name="citizenshipIssueDate"
              control={control}
              rules={{
                required: "Citizenship issue date is required",
                validate: (v) =>
                  !v || v <= todayStr || "Date cannot be in the future",
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  max={todayStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v);
                    if (v) {
                      const bs = adToBs(v);
                      if (bs) setValue("citizenshipIssueDateBS", bs);
                    }
                  }}
                  className="form-input"
                />
              )}
            />
          </div>

          <div className="date-column">
            <label className="small-label">{t("step1.dateOfBirthBS")}</label>
            <Controller
              name="citizenshipIssueDateBS"
              control={control}
              rules={{
                validate: (v) => {
                  if (!v) return true;
                  const ad = bsToAd(v);
                  return (
                    (ad && ad <= todayStr) || "Date cannot be in the future"
                  );
                },
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                      const ad = bsToAd(value);
                      if (ad) setValue("citizenshipIssueDate", ad);
                    }
                  }}
                  className="form-input"
                />
              )}
            />
          </div>
        </div>
        {errors.citizenshipIssueDate && (
          <p className="error-message">{errors.citizenshipIssueDate.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          {t("step1.citizenshipIssueDistrict")}{" "}
          <span className="required">*</span>
        </label>
        <Controller
          name="citizenshipIssueDistrict"
          control={control}
          rules={{ required: "Citizenship issue district is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.citizenshipIssueDistrict && (
          <p className="error-message">
            {errors.citizenshipIssueDistrict.message}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">{t("step1.beneficiaryIdNo")}</label>
        <Controller
          name="beneficiaryIdNo"
          control={control}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
      </div>

      <div className="form-field">
        <label className="form-label">{t("step1.panNumber")}</label>
        <Controller
          name="panNumber"
          control={control}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
      </div>

      <div className="form-field">
        <label className="form-label">{t("step1.identificationNo")}</label>
        <Controller
          name="identificationNo"
          control={control}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
      </div>

      <div className="form-field">
        <label className="form-label">{t("step1.identificationAddress")}</label>
        <Controller
          name="identificationAddress"
          control={control}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
      </div>
    </div>
  );

  const renderStep2 = () => {
    const handleSameAsCurrentAddress = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.checked) {
        const [ward, municipality, district, province, country] =
          currentAddress || ["", "", "", "", ""];
        setValue("permanentWardNo", ward || "");
        setValue("permanentMunicipality", municipality || "");
        setValue("permanentDistrict", district || "");
        setValue("permanentProvince", province || "");
        setValue("permanentCountry", country || "");
      }
    };

    return (
      <div className="form-section">
        <h2 className="section-title">{t("step2.title")}</h2>

        <h3 className="subsection-title">{t("step2.currentAddress")}</h3>
        <div className="grid-2-cols">
          {[
            "currentWardNo",
            "currentMunicipality",
            "currentDistrict",
            "currentProvince",
            "currentCountry",
          ].map((field) => (
            <div className="form-field" key={field}>
              <label className="form-label">
                {field
                  .replace("current", "")
                  .replace(/([A-Z])/g, " $1")
                  .trim()}{" "}
                <span className="required">*</span>
              </label>
              <Controller
                name={field as keyof FormData}
                control={control}
                rules={{ required: "This field is required" }}
                render={({ field: controllerField }) => (
                  <input
                    {...controllerField}
                    value={controllerField.value as string}
                    type="text"
                    className="form-input"
                  />
                )}
              />
              {errors[field as keyof FormData] && (
                <p className="error-message">
                  {errors[field as keyof FormData]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <h3 className="subsection-title">{t("step2.permanentAddress")}</h3>
        <div className="form-field" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label">
            <input
              type="checkbox"
              onChange={handleSameAsCurrentAddress}
              className="checkbox-input"
            />
            Same as current address
          </label>
        </div>

        <div className="grid-2-cols">
          {[
            "permanentWardNo",
            "permanentMunicipality",
            "permanentDistrict",
            "permanentProvince",
            "permanentCountry",
          ].map((field) => (
            <div className="form-field" key={field}>
              <label className="form-label">
                {field
                  .replace("permanent", "")
                  .replace(/([A-Z])/g, " $1")
                  .trim()}{" "}
                <span className="required">*</span>
              </label>
              <Controller
                name={field as keyof FormData}
                control={control}
                rules={{ required: "This field is required" }}
                render={({ field: controllerField }) => (
                  <input
                    {...controllerField}
                    value={controllerField.value as string}
                    type="text"
                    className="form-input"
                  />
                )}
              />
              {errors[field as keyof FormData] && (
                <p className="error-message">
                  {errors[field as keyof FormData]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <h3 className="subsection-title">{t("step2.contactInfo")}</h3>
        <div className="form-field">
          <label className="form-label">
            {t("step2.contactNumber")} <span className="required">*</span>
          </label>
          <Controller
            name="contactNumber"
            control={control}
            rules={{
              required: "Contact number is required",
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: "Invalid contact number",
              },
            }}
            render={({ field }) => (
              <input {...field} type="tel" className="form-input" />
            )}
          />
          {errors.contactNumber && (
            <p className="error-message">{errors.contactNumber.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            {t("step2.emailAddress")} <span className="required">*</span>
          </label>
          <Controller
            name="emailAddress"
            control={control}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            }}
            render={({ field }) => (
              <input {...field} type="email" className="form-input" />
            )}
          />
          {errors.emailAddress && (
            <p className="error-message">{errors.emailAddress.message}</p>
          )}
        </div>
      </div>
    );
  };
  const renderStep3 = () => {
    const gender = watch("gender");
    const maritalStatus = watch("maritalStatus");
    const showSpouseField = gender === "Female" && maritalStatus === "Married";
    const showInLawFields = gender === "Female" && maritalStatus === "Married";
    const childrenNames = watch("childrenNames") || [];

    const addChild = () => {
      setValue("childrenNames", [...childrenNames, ""]);
    };

    const removeChild = (index: number) => {
      const updatedChildren = childrenNames.filter((_, i) => i !== index);
      setValue("childrenNames", updatedChildren);
    };

    const updateChildName = (index: number, value: string) => {
      const updatedChildren = [...childrenNames];
      updatedChildren[index] = value;
      setValue("childrenNames", updatedChildren);
    };

    return (
      <div className="form-section">
        <h2 className="section-title">Family Information</h2>

        <div className="form-field">
          <label className="form-label">
            Marital Status <span className="required">*</span>
          </label>
          <Controller
            name="maritalStatus"
            control={control}
            rules={{ required: "Marital status is required" }}
            render={({ field }) => (
              <select {...field} className="form-input">
                <option value="">Select Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            )}
          />
          {errors.maritalStatus && (
            <p className="error-message">{errors.maritalStatus.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Father's Name <span className="required">*</span>
          </label>
          <Controller
            name="fatherName"
            control={control}
            rules={{ required: "Father's name is required" }}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
          {errors.fatherName && (
            <p className="error-message">{errors.fatherName.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Mother's Name <span className="required">*</span>
          </label>
          <Controller
            name="motherName"
            control={control}
            rules={{ required: "Mother's name is required" }}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
          {errors.motherName && (
            <p className="error-message">{errors.motherName.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Grandfather's Name <span className="required">*</span>
          </label>
          <Controller
            name="grandfatherName"
            control={control}
            rules={{ required: "Grandfather's name is required" }}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
          {errors.grandfatherName && (
            <p className="error-message">{errors.grandfatherName.message}</p>
          )}
        </div>
        {showSpouseField && (
          <>
            <div className="form-field">
              <label className="form-label">
                Spouse Name <span className="required">*</span>
              </label>
              <Controller
                name="spouseName"
                control={control}
                rules={{
                  required: showSpouseField ? "Spouse name is required" : false,
                }}
                render={({ field }) => (
                  <input {...field} type="text" className="form-input" />
                )}
              />
              {errors.spouseName && (
                <p className="error-message">{errors.spouseName.message}</p>
              )}
            </div>
          </>
        )}
        {showInLawFields && (
          <>
            <div className="form-field">
              <label className="form-label">
                Father-in-Law's Name <span className="required">*</span>
              </label>
              <Controller
                name="fatherInLawName"
                control={control}
                rules={{
                  required: showInLawFields
                    ? "Father-in-law's name is required"
                    : false,
                }}
                render={({ field }) => (
                  <input {...field} type="text" className="form-input" />
                )}
              />
              {errors.fatherInLawName && (
                <p className="error-message">
                  {errors.fatherInLawName.message}
                </p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Mother-in-Law's Name <span className="required">*</span>
              </label>
              <Controller
                name="motherInLawName"
                control={control}
                rules={{
                  required: showInLawFields
                    ? "Mother-in-law's name is required"
                    : false,
                }}
                render={({ field }) => (
                  <input {...field} type="text" className="form-input" />
                )}
              />
              {errors.motherInLawName && (
                <p className="error-message">
                  {errors.motherInLawName.message}
                </p>
              )}
            </div>
          </>
        )}

        {/* <div className="form-field">
          <label className="form-label">Spouse's Name</label>
          <Controller
            name="spouseName"
            control={control}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
        </div> */}

        <div className="form-field">
          <label className="form-label">Children's Names</label>
          {childrenNames.map((childName, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={childName}
                onChange={(e) => updateChildName(index, e.target.value)}
                className="form-input"
                placeholder={`Child ${index + 1} name`}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeChild(index)}
                className="btn btn-secondary"
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  padding: "8px 16px",
                  minWidth: "40px",
                }}
              >
                -
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChild}
            className="btn btn-secondary"
            style={{
              backgroundColor: "#10b981",
              color: "white",
              padding: "8px 16px",
              marginTop: "10px",
            }}
          >
            + Add Child
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="form-section">
      <h2 className="section-title">Bank Details</h2>

      <div className="form-field">
        <label className="form-label">
          Account Type <span className="required">*</span>
        </label>
        <div className="radio-group">
          {["Savings", "Current", "Business"].map((type) => (
            <div className="radio-item" key={type}>
              <Controller
                name="accountType"
                control={control}
                rules={{ required: "Account type is required" }}
                render={({ field }) => (
                  <input
                    type="radio"
                    id={`account-${type.toLowerCase()}`}
                    checked={field.value === type}
                    onChange={() => field.onChange(type)}
                    className="radio-input"
                  />
                )}
              />
              <label
                htmlFor={`account-${type.toLowerCase()}`}
                className="radio-label"
              >
                {type} Account
              </label>
            </div>
          ))}
        </div>
        {errors.accountType && (
          <p className="error-message">{errors.accountType.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          Account Number <span className="required">*</span>
        </label>
        <Controller
          name="bankAccount"
          control={control}
          rules={{ required: "Account number is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.bankAccount && (
          <p className="error-message">{errors.bankAccount.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          Bank Name <span className="required">*</span>
        </label>
        <Controller
          name="bankName"
          control={control}
          rules={{ required: "Bank name is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.bankName && (
          <p className="error-message">{errors.bankName.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          Bank Address <span className="required">*</span>
        </label>
        <Controller
          name="bankAddress"
          control={control}
          rules={{ required: "Bank address is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.bankAddress && (
          <p className="error-message">{errors.bankAddress.message}</p>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="form-section">
      <h2 className="section-title">Occupation & Finance Details</h2>

      <div className="form-field">
        <label className="form-label">
          Occupation Type <span className="required">*</span>
        </label>
        <div className="radio-group">
          {[
            "Government",
            "Private",
            "Business",
            "Agriculture",
            "INGO/NGO",
            "Student",
            "Retired",
            "Other",
          ].map((type) => (
            <div className="radio-item" key={type}>
              <Controller
                name="occupationType"
                control={control}
                rules={{ required: "Occupation type is required" }}
                render={({ field }) => (
                  <input
                    type="radio"
                    id={`occupation-${type.toLowerCase()}`}
                    checked={field.value === type}
                    onChange={() => field.onChange(type)}
                    className="radio-input"
                  />
                )}
              />
              <label
                htmlFor={`occupation-${type.toLowerCase()}`}
                className="radio-label"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
        {errors.occupationType && (
          <p className="error-message">{errors.occupationType.message}</p>
        )}
        {occupationType === "Other" && (
          <div className="form-field">
            <label className="form-label">
              Please specify your occupation type{" "}
              <span className="required">*</span>
            </label>
            <Controller
              name="occupationOther"
              control={control}
              rules={{ required: "Please specify your occupation type" }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="form-input"
                  placeholder="Enter your occupation type"
                />
              )}
            />
            {errors.occupationOther && (
              <p className="error-message">{errors.occupationOther.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          Business Type <span className="required">*</span>
        </label>
        <div className="radio-group">
          {["Manufacturing", "Service Oriented", "Other"].map((type) => (
            <div className="radio-item" key={type}>
              <Controller
                name="businessType"
                control={control}
                rules={{ required: "Business type is required" }}
                render={({ field }) => (
                  <input
                    type="radio"
                    id={`business-${type.toLowerCase().replace(" ", "-")}`}
                    checked={field.value === type}
                    onChange={() => field.onChange(type)}
                    className="radio-input"
                  />
                )}
              />
              <label
                htmlFor={`business-${type.toLowerCase().replace(" ", "-")}`}
                className="radio-label"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
        {errors.businessType && (
          <p className="error-message">{errors.businessType.message}</p>
        )}
        {businessType === "Other" && (
          <div className="form-field">
            <label className="form-label">
              Please specify your business type{" "}
              <span className="required">*</span>
            </label>
            <Controller
              name="businessTypeOther"
              control={control}
              rules={{ required: "Please specify your business type" }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="form-input"
                  placeholder="Enter your business type"
                />
              )}
            />
            {errors.businessTypeOther && (
              <p className="error-message">
                {errors.businessTypeOther.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          Organization Name <span className="required">*</span>
        </label>
        <Controller
          name="organizationName"
          control={control}
          rules={{ required: "Organization name is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.organizationName && (
          <p className="error-message">{errors.organizationName.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">
          Organization Address <span className="required">*</span>
        </label>
        <Controller
          name="organizationAddress"
          control={control}
          rules={{ required: "Organization address is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.organizationAddress && (
          <p className="error-message">{errors.organizationAddress.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">Designation</label>
        <Controller
          name="designation"
          control={control}
          rules={{ required: "Designation is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.designation && (
          <p className="error-message">{errors.designation.message}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">Employee ID</label>
        <Controller
          name="employeeId"
          control={control}
          rules={{ required: "Employee ID is required" }}
          render={({ field }) => (
            <input {...field} type="text" className="form-input" />
          )}
        />
        {errors.employeeId && (
          <p className="error-message">{errors.employeeId.message}</p>
        )}
      </div>
      <div className="form-field">
        <label className="form-label">
          Annual Income <span className="required">*</span>
        </label>
        <Controller
          name="annualIncome"
          control={control}
          rules={{ required: "Annual income is required" }}
          render={({ field }) => {
            const currentValue = field.value || 0;
            return (
              <div>
                <Slider.Root
                  className="SliderRoot"
                  value={[currentValue]}
                  onValueChange={(value) => field.onChange(value[0])}
                  min={0}
                  max={1000000}
                  step={50000}
                >
                  <Slider.Track className="SliderTrack">
                    <Slider.Range className="SliderRange" />
                  </Slider.Track>
                  <Slider.Thumb className="SliderThumb" />
                </Slider.Root>
                <div className="slider-value-display">
                  <span>Min: Rs. 0</span>
                  <span className="current-value">
                    Current: Rs. {currentValue.toLocaleString("en-IN")}
                  </span>
                  <span>Max: More than 10 Lakh</span>
                </div>
              </div>
            );
          }}
        />
        {errors.annualIncome && (
          <p className="error-message">{errors.annualIncome.message}</p>
        )}
      </div>
    </div>
  );

  const renderStep6 = () => {
    if (userAge !== null && userAge >= 18) {
      return (
        <div className="form-section">
          <h2 className="section-title">Guardian Information</h2>
          <div
            style={{
              padding: "2rem",
              backgroundColor: "#d1fae5",
              borderRadius: "8px",
              border: "2px solid #10b981",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                color: "#047857",
                fontWeight: "600",
              }}
            >
              Guardian information is not required for adults (18+ years).
            </p>
            <p style={{ color: "#065f46", marginTop: "0.5rem" }}>
              You are {userAge} years old.
            </p>
          </div>
        </div>
      );
    }

    const handleSameAsCurrentGuardian = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.checked) {
        const [ward, municipality, district, province, country] = getValues([
          "currentWardNo",
          "currentMunicipality",
          "currentDistrict",
          "currentProvince",
          "currentCountry",
        ]);
        setValue("guardianWardNo", ward || "");
        setValue("guardianMunicipality", municipality || "");
        setValue("guardianDistrict", district || "");
        setValue("guardianProvince", province || "");
        setValue("guardianCountry", country || "");
      }
    };

    return (
      <div className="form-section">
        <h2 className="section-title">Guardian Information</h2>
        {userAge !== null && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fef3c7",
              borderRadius: "8px",
              border: "2px solid #f59e0b",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ color: "#92400e" }}>
              <strong>Age:</strong> {userAge} years old - Guardian information
              is required.
            </p>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">
            Guardian Name <span className="required">*</span>
          </label>
          <Controller
            name="guardianName"
            control={control}
            rules={{ required: "Guardian name is required" }}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
          {errors.guardianName && (
            <p className="error-message">{errors.guardianName.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Relationship <span className="required">*</span>
          </label>
          <Controller
            name="relationship"
            control={control}
            rules={{ required: "Relationship is required" }}
            render={({ field }) => (
              <select {...field} className="form-input">
                <option value="">Select Relationship</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Other">Other</option>
              </select>
            )}
          />
          {errors.relationship && (
            <p className="error-message">{errors.relationship.message}</p>
          )}
        </div>

        <div className="form-field" style={{ marginBottom: "1rem" }}>
          <label className="form-label">
            <input
              type="checkbox"
              onChange={handleSameAsCurrentGuardian}
              className="checkbox-input"
            />{" "}
            Same as current address
          </label>
        </div>

        <div className="grid-2-cols">
          {[
            { name: "guardianWardNo", label: "Ward No" },
            { name: "guardianMunicipality", label: "Municipality" },
            { name: "guardianDistrict", label: "District" },
            { name: "guardianProvince", label: "Province" },
            { name: "guardianCountry", label: "Country" },
          ].map(({ name, label }) => (
            <div className="form-field" key={name}>
              <label className="form-label">
                {label} <span className="required">*</span>
              </label>
              <Controller
                name={name as keyof FormData}
                control={control}
                rules={{ required: `${label} is required` }}
                render={({ field }) => (
                  <input
                    type="text"
                    className="form-input"
                    value={(field.value as string) ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
              {errors[name as keyof FormData] && (
                <p className="error-message">
                  {(errors as any)[name]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="form-field">
          <label className="form-label">
            Mobile Number <span className="required">*</span>
          </label>
          <Controller
            name="mobileNumber"
            control={control}
            rules={{
              required: "Mobile number is required",
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: "Invalid mobile number",
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="tel"
                className="form-input"
                placeholder="e.g., 98XXXXXXXX"
              />
            )}
          />
          {errors.mobileNumber && (
            <p className="error-message">{errors.mobileNumber.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Email <span className="required">*</span>
          </label>
          <Controller
            name="email"
            control={control}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="email"
                className="form-input"
                placeholder="guardian@example.com"
              />
            )}
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">Guardian PAN Number</label>
          <Controller
            name="panNumberGuardian"
            control={control}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            Birth Registration Number <span className="required">*</span>
          </label>
          <Controller
            name="birthRegistrationNumber"
            control={control}
            rules={{ required: "Birth registration number is required" }}
            render={({ field }) => (
              <input {...field} type="text" className="form-input" />
            )}
          />
          {errors.birthRegistrationNumber && (
            <p className="error-message">
              {errors.birthRegistrationNumber.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Issue Date <span className="required">*</span>
          </label>
          <div className="grid-2-cols">
            <div className="date-column">
              <label className="small-label">English Date (AD)</label>
              <Controller
                name="issueDate"
                control={control}
                rules={{
                  required: "Issue date is required",
                  validate: (v) =>
                    !v || v <= todayStr || "Date cannot be in the future",
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    max={todayStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v);
                      if (v) {
                        const bs = adToBs(v);
                        if (bs) setValue("issueDateBS", bs);
                      }
                    }}
                    className="form-input"
                  />
                )}
              />
            </div>

            <div className="date-column">
              <label className="small-label">Nepali Date (BS)</label>
              <Controller
                name="issueDateBS"
                control={control}
                rules={{
                  validate: (v) => {
                    if (!v) return true;
                    const ad = bsToAd(v);
                    return (
                      (ad && ad <= todayStr) || "Date cannot be in the future"
                    );
                  },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="YYYY-MM-DD"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value);
                      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        const ad = bsToAd(value);
                        if (ad) setValue("issueDate", ad);
                      }
                    }}
                    className="form-input"
                  />
                )}
              />
            </div>
          </div>
          {errors.issueDate && (
            <p className="error-message">{errors.issueDate.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Issue Authority <span className="required">*</span>
          </label>
          <Controller
            name="issueAuthority"
            control={control}
            rules={{ required: "Issue authority is required" }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="form-input"
                placeholder="e.g., District Administration Office"
              />
            )}
          />
          {errors.issueAuthority && (
            <p className="error-message">{errors.issueAuthority.message}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            Guardian Signature <span className="required">*</span>
          </label>
          <div
            style={{
              border: "1px solid #ccc",
              width: "100%",
              height: "200px",
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "signature-canvas",
                style: { width: "100%", height: "100%" },
              }}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <button
              type="button"
              onClick={clearSignature}
              className="btn btn-secondary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={saveSignature}
              className="btn btn-secondary"
              style={{ marginLeft: "10px" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderStep7 = () => {
    return (
      <div className="form-section">
        <h2 className="section-title">Investment Disclosure</h2>
        <div className="form-field">
          <label className="form-label">
            <Controller
              name="investmentInvolved"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="checkbox-input"
                />
              )}
            />
            I am involved in other investment companies
          </label>
        </div>

        {investmentInvolved && (
          <div className="form-field">
            <label className="form-label">Details (if any)</label>
            <Controller
              name="investmentDetails"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="form-textarea"
                  rows={4}
                  placeholder="Please provide details about your investment companies"
                />
              )}
            />
          </div>
        )}

        <h2 className="section-title" style={{ marginTop: "2rem" }}>
          Legal Consent
        </h2>
        <div className="form-field">
          <label className="form-label">Declaration</label>
          <Controller
            name="legalDeclaration"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="form-textarea"
                rows={5}
                placeholder="Enter your legal declaration here"
              />
            )}
          />
        </div>

        <div className="form-field">
          <label className="form-label">
            <Controller
              name="legalConsent"
              control={control}
              rules={{ required: "You must accept legal responsibility" }}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="checkbox-input"
                />
              )}
            />
            I confirm the above information is true and I accept legal
            responsibility.
          </label>
          {errors.legalConsent && (
            <p className="error-message">{errors.legalConsent.message}</p>
          )}
        </div>

        <h2 className="section-title" style={{ marginTop: "2rem" }}>
          Location Map
        </h2>
        <div className="form-group">
          <label className="form-label">
            Click on the map to select your location
          </label>
          <div style={{ height: "400px", width: "100%", marginBottom: "1rem" }}>
            <MapContainer
              center={mapPosition}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationPicker />
              <Marker position={mapPosition}>
                <Popup>
                  Selected Location
                  <br />
                  Lat: {mapPosition[0].toFixed(6)}
                  <br />
                  Lng: {mapPosition[1].toFixed(6)}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#eff6ff",
              borderRadius: "8px",
            }}
          >
            <p>
              <strong>Selected Location:</strong>
            </p>
            <p>Latitude: {mapPosition[0].toFixed(6)}</p>
            <p>Longitude: {mapPosition[1].toFixed(6)}</p>
            <button
              type="button"
              onClick={captureMapScreenshot}
              className="btn btn-secondary"
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "500",
              }}
            >
              📸 Take Screenshot of Location
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderStep8 = () => {
    const handleFileUpload = async (
      e: React.ChangeEvent<HTMLInputElement>,
      fieldName: keyof FormData
    ) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert(
            `❌ File size exceeds 5MB limit. Your file is ${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB`
          );
          return;
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (!validTypes.includes(file.type)) {
          alert("❌ Invalid file type. Please upload JPG, PNG, or PDF only.");
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setValue(fieldName, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const removeImage = (fieldName: keyof FormData) => {
      setValue(fieldName, "");
    };

    const getFileSize = (base64String: string | undefined): string => {
      if (!base64String) return "0 KB";
      const padding = (4 - (base64String.length % 4)) % 4;
      const bytes = Math.ceil((base64String.length * 3) / 4) - padding;
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const isImageFile = (base64String: string | undefined): boolean => {
      if (!base64String) return false;
      return base64String.includes("data:image");
    };

    return (
      <div className="form-section">
        <h2 className="section-title">Document Upload</h2>
        <p className="section-description">
          Please upload clear images of the required documents. Accepted
          formats: JPG, PNG, PDF (Max 5MB each)
        </p>

        {/* Citizenship Front */}
        <div className="form-field">
          <label className="form-label">
            Citizenship Certificate (Front) <span className="required">*</span>
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileUpload(e, "citizenshipFrontImage")}
            className="form-input"
          />
          {watch("citizenshipFrontImage") && (
            <div className="upload-preview">
              <div className="upload-status">
                <span className="upload-success">✓ File uploaded</span>
                <span className="upload-size">
                  {getFileSize(watch("citizenshipFrontImage"))}
                </span>
              </div>
              {isImageFile(watch("citizenshipFrontImage")) && (
                <div className="image-preview-container">
                  <img
                    src={watch("citizenshipFrontImage")}
                    alt="Citizenship Front Preview"
                    className="image-preview"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage("citizenshipFrontImage")}
                className="btn-remove-file"
              >
                ✕ Remove
              </button>
            </div>
          )}
          {errors.citizenshipFrontImage && (
            <p className="error-message">
              {errors.citizenshipFrontImage.message}
            </p>
          )}
        </div>

        {/* Citizenship Back */}
        <div className="form-field">
          <label className="form-label">
            Citizenship Certificate (Back) <span className="required">*</span>
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileUpload(e, "citizenshipBackImage")}
            className="form-input"
          />
          {watch("citizenshipBackImage") && (
            <div className="upload-preview">
              <div className="upload-status">
                <span className="upload-success">✓ File uploaded</span>
                <span className="upload-size">
                  {getFileSize(watch("citizenshipBackImage"))}
                </span>
              </div>
              {isImageFile(watch("citizenshipBackImage")) && (
                <div className="image-preview-container">
                  <img
                    src={watch("citizenshipBackImage")}
                    alt="Citizenship Back Preview"
                    className="image-preview"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage("citizenshipBackImage")}
                className="btn-remove-file"
              >
                ✕ Remove
              </button>
            </div>
          )}
          {errors.citizenshipBackImage && (
            <p className="error-message">
              {errors.citizenshipBackImage.message}
            </p>
          )}
        </div>

        {/* Passport (for NRN) */}
        {watch("nationality") === "Other" && (
          <div className="form-field">
            <label className="form-label">
              Passport Copy <span className="required">*</span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileUpload(e, "passportImage")}
              className="form-input"
            />
            {watch("passportImage") && (
              <div className="upload-preview">
                <div className="upload-status">
                  <span className="upload-success">✓ File uploaded</span>
                  <span className="upload-size">
                    {getFileSize(watch("passportImage"))}
                  </span>
                </div>
                {isImageFile(watch("passportImage")) && (
                  <div className="image-preview-container">
                    <img
                      src={watch("passportImage")}
                      alt="Passport Preview"
                      className="image-preview"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage("passportImage")}
                  className="btn-remove-file"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Photo */}
        <div className="form-field">
          <label className="form-label">
            Recent Passport Size Photo <span className="required">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "photoImage")}
            className="form-input"
          />
          {watch("photoImage") && (
            <div className="upload-preview">
              <div className="upload-status">
                <span className="upload-success">✓ File uploaded</span>
                <span className="upload-size">
                  {getFileSize(watch("photoImage"))}
                </span>
              </div>
              <div className="image-preview-container">
                <img
                  src={watch("photoImage")}
                  alt="Photo Preview"
                  className="image-preview"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage("photoImage")}
                className="btn-remove-file"
              >
                ✕ Remove
              </button>
            </div>
          )}
          {errors.photoImage && (
            <p className="error-message">{errors.photoImage.message}</p>
          )}
        </div>

        {/* PAN Card (Optional) */}
        <div className="form-field">
          <label className="form-label">PAN Card Copy (Optional)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileUpload(e, "panCardImage")}
            className="form-input"
          />
          {watch("panCardImage") && (
            <div className="upload-preview">
              <div className="upload-status">
                <span className="upload-success">✓ File uploaded</span>
                <span className="upload-size">
                  {getFileSize(watch("panCardImage"))}
                </span>
              </div>
              {isImageFile(watch("panCardImage")) && (
                <div className="image-preview-container">
                  <img
                    src={watch("panCardImage")}
                    alt="PAN Card Preview"
                    className="image-preview"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage("panCardImage")}
                className="btn-remove-file"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        {/* Fingerprint Image */}
        <div className="form-field">
          <label className="form-label">
            Fingerprint Image <span className="required">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "fingerprintImage")}
            className="form-input"
          />
          {watch("fingerprintImage") && (
            <div className="upload-preview">
              <div className="upload-status">
                <span className="upload-success">✓ File uploaded</span>
                <span className="upload-size">
                  {getFileSize(watch("fingerprintImage"))}
                </span>
              </div>
              <div className="image-preview-container">
                <img
                  src={watch("fingerprintImage")}
                  alt="Fingerprint Preview"
                  className="image-preview"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage("fingerprintImage")}
                className="btn-remove-file"
              >
                ✕ Remove
              </button>
            </div>
          )}
          {errors.fingerprintImage && (
            <p className="error-message">{errors.fingerprintImage.message}</p>
          )}
        </div>

        {/* Location Map Image */}
        <div className="form-field">
          <label className="form-label">
            Location Map Screenshot <span className="required">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "locationMapImage")}
            className="form-input"
          />
          {watch("locationMapImage") && (
            <div className="upload-preview">
              <div className="upload-status">
                <span className="upload-success">✓ File uploaded</span>
                <span className="upload-size">
                  {getFileSize(watch("locationMapImage"))}
                </span>
              </div>
              <div className="image-preview-container">
                <img
                  src={watch("locationMapImage")}
                  alt="Location Map Preview"
                  className="image-preview image-preview-large"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage("locationMapImage")}
                className="btn-remove-file"
              >
                ✕ Remove
              </button>
            </div>
          )}
          {errors.locationMapImage && (
            <p className="error-message">{errors.locationMapImage.message}</p>
          )}
        </div>

        {/* For Minors - Additional Documents */}
        {isMinorByAge && (
          <>
            <h3 className="subsection-title" style={{ marginTop: "2rem" }}>
              Guardian Documents (Required for Minors)
            </h3>

            <div className="form-field">
              <label className="form-label">
                Birth Certificate <span className="required">*</span>
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, "birthCertificateImage")}
                className="form-input"
              />
              {watch("birthCertificateImage") && (
                <div className="upload-preview">
                  <div className="upload-status">
                    <span className="upload-success">✓ File uploaded</span>
                    <span className="upload-size">
                      {getFileSize(watch("birthCertificateImage"))}
                    </span>
                  </div>
                  {isImageFile(watch("birthCertificateImage")) && (
                    <div className="image-preview-container">
                      <img
                        src={watch("birthCertificateImage")}
                        alt="Birth Certificate Preview"
                        className="image-preview"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage("birthCertificateImage")}
                    className="btn-remove-file"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Guardian's Citizenship Certificate{" "}
                <span className="required">*</span>
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  handleFileUpload(e, "guardianCitizenshipImage")
                }
                className="form-input"
              />
              {watch("guardianCitizenshipImage") && (
                <div className="upload-preview">
                  <div className="upload-status">
                    <span className="upload-success">✓ File uploaded</span>
                    <span className="upload-size">
                      {getFileSize(watch("guardianCitizenshipImage"))}
                    </span>
                  </div>
                  {isImageFile(watch("guardianCitizenshipImage")) && (
                    <div className="image-preview-container">
                      <img
                        src={watch("guardianCitizenshipImage")}
                        alt="Guardian Citizenship Preview"
                        className="image-preview"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage("guardianCitizenshipImage")}
                    className="btn-remove-file"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                Guardian's Photo <span className="required">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "guardianPhotoImage")}
                className="form-input"
              />
              {watch("guardianPhotoImage") && (
                <div className="upload-preview">
                  <div className="upload-status">
                    <span className="upload-success">✓ File uploaded</span>
                    <span className="upload-size">
                      {getFileSize(watch("guardianPhotoImage"))}
                    </span>
                  </div>
                  <div className="image-preview-container">
                    <img
                      src={watch("guardianPhotoImage")}
                      alt="Guardian Photo Preview"
                      className="image-preview"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage("guardianPhotoImage")}
                    className="btn-remove-file"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderStep9 = () => {
    const formValues = getValues();

    return (
      <div className="form-section">
        <h2 className="section-title">Final Review & Submission</h2>
        <div className="final-review-section">
          <div className="review-header">
            <h3>Review Your Information Before Submission</h3>
            <p className="review-subtitle">
              Please review all the information you have provided. Once
              submitted, you cannot make changes to this application.
            </p>
          </div>

          <div className="review-summary">
            <div className="summary-card">
              <h4>Personal Information</h4>
              <div className="summary-item">
                <span className="summary-label">Full Name:</span>
                <span className="summary-value">
                  {formValues.fullName || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Date of Birth:</span>
                <span className="summary-value">
                  {formValues.dateOfBirth || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Gender:</span>
                <span className="summary-value">
                  {formValues.gender || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Citizenship Number:</span>
                <span className="summary-value">
                  {formValues.citizenshipNumber || "Not provided"}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <h4>Contact Information</h4>
              <div className="summary-item">
                <span className="summary-label">Contact Number:</span>
                <span className="summary-value">
                  {formValues.contactNumber || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Email:</span>
                <span className="summary-value">
                  {formValues.emailAddress || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Current Address:</span>
                <span className="summary-value">
                  {formValues.currentWardNo
                    ? `${formValues.currentWardNo}, ${formValues.currentMunicipality}, ${formValues.currentDistrict}`
                    : "Not provided"}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <h4>Bank Details</h4>
              <div className="summary-item">
                <span className="summary-label">Account Type:</span>
                <span className="summary-value">
                  {formValues.accountType || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Bank Name:</span>
                <span className="summary-value">
                  {formValues.bankName || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Account Number:</span>
                <span className="summary-value">
                  {formValues.bankAccount
                    ? `****${formValues.bankAccount.slice(-4)}`
                    : "Not provided"}
                </span>
              </div>
            </div>

            <div className="summary-card">
              <h4>Occupation Details</h4>
              <div className="summary-item">
                <span className="summary-label">Occupation Type:</span>
                {formValues.occupationType === "Other" && (
                  <div className="summary-item">
                    <span className="summary-label">
                      Other Occupation Type:
                    </span>
                    <span className="summary-value">
                      {formValues.occupationOther || "Not provided"}
                    </span>
                  </div>
                )}
                <span className="summary-value">
                  {formValues.occupationType || "Not provided"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Annual Income:</span>
                <span className="summary-value">
                  {formValues.annualIncome || "Not provided"}
                </span>
              </div>
              {formValues.isMinor && (
                <>
                  <div className="summary-item">
                    <span className="summary-label">Guardian Name:</span>
                    <span className="summary-value">
                      {formValues.guardianName || "Not provided"}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Relationship:</span>
                    <span className="summary-value">
                      {formValues.relationship || "Not provided"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">
              <input type="checkbox" required className="checkbox-input" />I
              confirm that all the information provided is accurate and complete
              to the best of my knowledge.
            </label>
          </div>

          <div className="form-field">
            <label className="form-label">
              <input type="checkbox" required className="checkbox-input" />I
              agree to the terms and conditions and understand that false
              information may lead to legal consequences.
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmationPage = () => (
    // Keep your existing confirmation page as is
    <div className="confirmation-page">
      {/* ... (your existing confirmation page code) ... */}
    </div>
  );

  return (
    <>
      {/* {!emailVerified ? (
        <OtpVerification
          sessionId={sessionId}
          onVerificationSuccess={(email: string) => {
            setUserEmail(email);
            setEmailVerified(true);
          }}
        />
      ) : ( */}
      <FormProvider {...methods}>
        <div className="form-container">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={() =>
              i18n.changeLanguage(i18n.language === "en" ? "ne" : "en")
            }
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              padding: "10px 20px",
              backgroundColor: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
            }}
          >
            {i18n.language === "en" ? "🇳🇵 नेपाली" : "🇬🇧 English"}
          </button>
          {currentStep !== totalStepsCount && (
            <div className="progress-container">
              <div className="progress-wrapper">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => {
                  // Skip step 6 for adults
                  if (userAge !== null && userAge >= 18 && step === 6) {
                    return null;
                  }

                  // Adjust displayed step number for adults after step 6
                  const displayStep =
                    userAge !== null && userAge >= 18 && step > 6
                      ? step - 1
                      : step;
                  const isActive =
                    userAge !== null && userAge >= 18
                      ? currentStep >= displayStep && currentStep !== 6
                      : currentStep >= step;
                  const isCurrent =
                    userAge !== null && userAge >= 18
                      ? currentStep === displayStep && currentStep !== 6
                      : currentStep === step;

                  return (
                    <div
                      key={step}
                      className={`progress-step ${isActive ? "active" : ""}`}
                    >
                      <div
                        className={`progress-circle ${
                          isCurrent ? "active" : "inactive"
                        }`}
                      >
                        {currentStep >
                        (userAge !== null && userAge >= 18 && step > 6
                          ? step - 1
                          : step)
                          ? "✓"
                          : displayStep}
                      </div>
                      <div className="progress-label">Step {displayStep}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {currentStep !== totalStepsCount ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              {renderStep()}

              <div className="form-navigation">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn btn-previous"
                  >
                    Previous
                  </button>
                )}

                {currentStep < totalStepsCount - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-next"
                  >
                    Next
                  </button>
                )}

                {currentStep === totalStepsCount - 1 && (
                  <button type="submit" className="btn btn-submit">
                    Submit Application
                  </button>
                )}
              </div>
            </form>
          ) : (
            renderConfirmationPage()
          )}
        </div>
      </FormProvider>
      {/* )}
      ; */}
    </>
  );
}

// Helper function to convert annual income to range
const getIncomeRange = (income: number): string => {
  if (income <= 500000) {
    return "Up to Rs. 5,00,000";
  } else if (income <= 1000000) {
    return "From Rs. 5,00,001 to Rs. 10,00,000";
  } else {
    return "Above Rs. 10,00,000";
  }
};
export default Form;
