import api from "./api";

export const getMyKyc = async () => {
  const { data } = await api.get("/api/Kyc");
  return data;
};

export const savePersonalInfo = async (personalData) => {
  const { data } = await api.post("/api/Kyc/section/personal-info", {
    fullName: personalData.fullName,
    dobAd: personalData.dobAd,
    dobBs: personalData.dobBs,
    gender: personalData.gender,
    nationality: personalData.nationality,
    citizenshipNo: personalData.citizenshipNo,
    citizenshipIssueDate: personalData.citizenshipIssueDate,
    citizenshipIssueDistrict: personalData.citizenshipIssueDistrict,
    panNo: personalData.panNo,
  });
  return data;
};

export const saveAddress = async (addressData) => {
  const { data } = await api.post("/api/Kyc/section/address", {
    currentMunicipality: addressData.currentMunicipality,
    currentDistrict: addressData.currentDistrict,
    currentProvince: addressData.currentProvince,
    currentCountry: addressData.currentCountry,
    permanentMunicipality: addressData.permanentMunicipality,
    permanentDistrict: addressData.permanentDistrict,
    permanentProvince: addressData.permanentProvince,
    permanentCountry: addressData.permanentCountry,
    wardNo: addressData.wardNo,
    contactNumber: addressData.contactNumber,
    email: addressData.email,
  });
  return data;
};

export const saveFamily = async (familyData) => {
  const { data } = await api.post("/api/Kyc/section/family", familyData);
  return data;
};

export const saveBank = async (bankData) => {
  const { data } = await api.post("/api/Kyc/section/bank", bankData);
  return data;
};

export const saveOccupation = async (occupationData) => {
  const { data } = await api.post(
    "/api/Kyc/section/occupation",
    occupationData
  );
  return data;
};
