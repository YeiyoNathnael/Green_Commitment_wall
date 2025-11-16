import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  type: 'company' | 'ngo' | 'school' | 'government' | 'other';
  description?: string;
  logo?: string;
  adminUserIds: mongoose.Types.ObjectId[];
  memberUserIds: mongoose.Types.ObjectId[];
  totalOrgCarbonSaved: number;
  settings: {
    colors?: string[];
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['company', 'ngo', 'school', 'government', 'other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    logo: {
      type: String,
    },
    adminUserIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    memberUserIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    totalOrgCarbonSaved: {
      type: Number,
      default: 0,
      min: 0,
    },
    settings: {
      colors: [String],
      website: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ totalOrgCarbonSaved: -1 });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
