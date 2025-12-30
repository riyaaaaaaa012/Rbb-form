const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// ✅ NEW KYC SCHEMA (Matches RBBB Form)
const kycSchema = new mongoose.Schema(
  {
    // Basic Information
    accountNo: {
      type: String,
      required: true,
      unique: true,
    },
    referenceNo: String,
    date: {
      type: Date,
      default: Date.now,
    },

    // Personal Details
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      bs: String, // Bikram Sambat (e.g., "2045/05/15")
      ad: Date, // Anno Domini
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    nationality: {
      type: String,
      default: "Nepali",
    },
    citizenshipNo: String,
    issueDistrict: String,
    issueDate: String,
    beneficiaryId: String,
    pan: String,

    // NRN Details (Non-Resident Nepali)
    nrnDetails: {
      identificationNo: String,
      address: String,
    },

    // Current Address
    currentAddress: {
      country: { type: String, default: "Nepal" },
      province: String,
      district: String,
      municipality: String,
      ward: String,
      tole: String,
      phone: String,
      mobile: String,
      email: String,
    },

    // Permanent Address
    permanentAddress: {
      country: { type: String, default: "Nepal" },
      province: String,
      district: String,
      municipality: String,
      ward: String,
      tole: String,
      phone: String,
      mobile: String,
      email: String,
    },

    // Family Details
    family: {
      grandfather: String,
      father: String,
      mother: String,
      spouse: String,
      son: String,
      daughterInLaw: String,
      daughter: String,
      fatherInLaw: String,
      motherInLaw: String,
    },

    // Bank Account Details
    bankDetails: {
      accountType: {
        type: String,
        enum: ["Saving Account", "Current Account"],
      },
      accountNo: String,
      bankName: String,
      bankAddress: String,
    },

    // Occupation Details (allow nested object as sent by frontend)
    occupation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Financial Details
    financial: {
      incomeRange: {
        type: String,
        enum: [
          "Up to Rs. 5,00,000",
          "From Rs. 5,00,001 to Rs. 10,00,000",
          "Above Rs. 10,00,000",
        ],
      },
      incomeSource: String, // e.g., "Salary/Wages", "Business Income", etc.
      businessType: String, // "Manufacturing", "Service Oriented", "Others"
    },

    // Transaction Related Information
    transactionInfo: {
      otherBrokerAccount: { type: Boolean, default: false },
      isBlacklisted: { type: Boolean, default: false },
      investmentCompanyInvolvement: { type: Boolean, default: false },
      investmentCompanyDetails: {
        companyName: String,
        designation: String, // Director, Executive, Shareholder, Employee
      },
    },

    // Guardian Details (for minors only)
    guardian: {
      name: String,
      relationship: String,
      address: {
        country: String,
        province: String,
        district: String,
        municipality: String,
        ward: String,
        phone: String,
        mobile: String,
        email: String,
        fax: String,
      },
      pan: String,
      birthRegNo: String,
      issueDate: String,
      issuingAuthority: String,
    },

    // AML/CFT Details (Anti-Money Laundering)
    amlDetails: {
      isPoliticallyExposed: { type: Boolean, default: false },
      relatedToPoliticalPerson: { type: Boolean, default: false },
      relatedPersonName: String,
      relatedPersonRelationship: String,
      hasBeneficialOwner: { type: Boolean, default: false },
      beneficialOwnerName: String,
      beneficialOwnerRelationship: String,
      hasConviction: { type: Boolean, default: false },
      convictionDetails: String,
      hasDifferentBeneficiary: { type: Boolean, default: false },
    },

    // Location Map
    locationMap: String, // URL or base64 image

    // Documents (store as base64 or file URLs)
    documents: {
      citizenshipCopy: String,
      passportCopy: String,
      photo: String,
      guardianPhoto: String,
      birthCertificate: String,
      employeeIdCopy: String,
      signatureImage: String,
      thumbPrint: {
        right: String,
        left: String,
      },
    },

    // Status & Verification
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
    },
    verifiedBy: String,
    verificationDate: Date,
    rejectionReason: String,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create indexes for faster queries
kycSchema.index({ accountNo: 1 });
kycSchema.index({ pan: 1 });
kycSchema.index({ citizenshipNo: 1 });
kycSchema.index({ status: 1 });

const KYC = mongoose.model("KYC", kycSchema);

// ========================================
// API ROUTES
// ========================================

app.post("/api/kyc/submit", async (req, res) => {
  try {
    console.log("📝 Received KYC submission:", req.body);

    const newKYC = new KYC(req.body);
    await newKYC.save();

    console.log("✅ KYC saved successfully:", newKYC._id);
    res.json({
      success: true,
      message: "KYC submitted successfully",
      data: newKYC,
    });
  } catch (error) {
    console.error("❌ Error saving KYC:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all KYC forms (MUST come before /:id route)
app.get("/api/kyc/all", async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = status ? { status } : {};

    // Get paginated results
    const kycs = await KYC.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await KYC.countDocuments(query);

    res.json({
      success: true,
      data: kycs,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error("❌ Error fetching KYCs:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get KYC by account number (MUST come before /:id route)
app.get("/api/kyc/account/:accountNo", async (req, res) => {
  try {
    const kyc = await KYC.findOne({ accountNo: req.params.accountNo });

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC form not found",
      });
    }

    res.json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single KYC by ID (GENERIC - comes LAST)
app.get("/api/kyc/:id", async (req, res) => {
  try {
    // Validate that :id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC ID format",
      });
    }

    const kyc = await KYC.findById(req.params.id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC form not found",
      });
    }

    res.json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    console.error("❌ Error fetching KYC:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update KYC status (for admin)
app.patch("/api/kyc/:id/status", async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC ID format",
      });
    }

    const { status, verifiedBy, rejectionReason } = req.body;

    const updateData = {
      status,
      verifiedBy,
      verificationDate: new Date(),
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const kyc = await KYC.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC form not found",
      });
    }

    res.json({
      success: true,
      message: "KYC status updated successfully",
      data: kyc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete KYC (use with caution)
app.delete("/api/kyc/:id", async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC ID format",
      });
    }

    const kyc = await KYC.findByIdAndDelete(req.params.id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC form not found",
      });
    }

    res.json({
      success: true,
      message: "KYC form deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "KYC API is running",
    endpoints: {
      submit: "POST /api/kyc/submit",
      getAll: "GET /api/kyc/all",
      getOne: "GET /api/kyc/:id",
      updateStatus: "PATCH /api/kyc/:id/status",
      delete: "DELETE /api/kyc/:id",
    },
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
