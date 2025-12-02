export type CollegeStudentType = "" | "freshman" | "transferee" | "sti-transferee"

export type SchoolOption = {
  id: number
  name: string
  type: "feeder" | "competitor" | "non-feeder"
}

export type StudentFormData = {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  civilStatus: string
  gender: string
  landline: string
  mobileNumber: string
  email: string
  lastSchoolAttended: string
  schoolName: string
  programTrackStrand: string
  studentType: "" | "college" | "senior-high"
  programs: string[]
  program: string
  collegeStudentType: CollegeStudentType
  studentNumber: string
}

export type EnrollmentRecord = {
  id: number
  name: string
  email: string
  phone: string
  program: string
  date: string
  studentType: string
  lastSchoolAttended: string
  schoolName?: string
  programTrackStrand?: string
  collegeStudentType?: CollegeStudentType
  studentNumber?: string
}

export const PROGRAM_CODE_TO_LABEL: Record<string, string> = {
  "bsit": "BS Information Technology (BSIT)",
  "bscs": "BS Computer Science (BSCS)",
  "bshm": "BS Hospitality Management (BSHM)",
  "bstm": "BS Tourism Management (BSTM)",
  "bsba": "BS Business Administration (BSBA)",
  "it-mobile": "IT in Mobile App and Web Development",
  "humms": "Humanities and Social Sciences (HUMMS)",
  "abm": "Accountancy, Business, and Management (ABM)",
}

export const PROGRAM_LABEL_TO_CODE = Object.fromEntries(
  Object.entries(PROGRAM_CODE_TO_LABEL).map(([code, label]) => [label, code]),
)

const STUDENT_FORM_TEMPLATE: StudentFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  civilStatus: "",
  gender: "",
  landline: "",
  mobileNumber: "",
  email: "",
  lastSchoolAttended: "",
  schoolName: "",
  programTrackStrand: "",
  studentType: "",
  programs: [],
  program: "",
  collegeStudentType: "",
  studentNumber: "",
}

export const createEmptyStudentFormData = (): StudentFormData => ({
  ...STUDENT_FORM_TEMPLATE,
  programs: [],
})

export const mapProgramStringToCodes = (programString: string): string[] => {
  return programString
    .split(",")
    .map((part) => part.trim())
    .map((label) => {
      if (PROGRAM_LABEL_TO_CODE[label]) return PROGRAM_LABEL_TO_CODE[label]
      const match = Object.entries(PROGRAM_CODE_TO_LABEL).find(([code, fullLabel]) =>
        fullLabel.toLowerCase().includes(label.toLowerCase()),
      )
      return match ? match[0] : ""
    })
    .filter(Boolean)
}

export const mapProgramCodesToLabel = (codes: string[], fallback: string) => {
  if (codes.length === 0) return fallback || "Not specified"
  return codes
    .map((code) => PROGRAM_CODE_TO_LABEL[code] || code)
    .join(", ")
}