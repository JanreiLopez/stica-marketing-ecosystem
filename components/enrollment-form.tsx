"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { StudentFormData, SchoolOption } from "@/lib/enrollment-data"
import { supabase } from "@/lib/supabase-client"

type EnrollmentFormProps = {
  studentFormData: StudentFormData
  setStudentFormData: Dispatch<SetStateAction<StudentFormData>>
  isEnrollment?: boolean
}

export function EnrollmentForm({ studentFormData, setStudentFormData, isEnrollment = false }: EnrollmentFormProps) {
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false)

  // Fetch schools based on last school attended
  useEffect(() => {
    const fetchSchools = async () => {
      if (!studentFormData.lastSchoolAttended) {
        setSchools([])
        return
      }
      
      setLoadingSchools(true)
      
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, type')
          .eq('status', 'Active')
          
        if (error) throw error
        
        // Show all active schools regardless of last school attended
        setSchools(data as SchoolOption[])
      } catch (error) {
        console.error("Error fetching schools:", error)
        setSchools([])
      } finally {
        setLoadingSchools(false)
      }
    }
    
    fetchSchools()
  }, [studentFormData.lastSchoolAttended])

  const handleArrayChange = (field: "programs", value: string, checked: boolean) => {
    setStudentFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((id) => id !== value),
    }))
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF STUDENT</Label>
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="student-senior-high"
              name="studentType"
              value="senior-high"
              checked={studentFormData.studentType === "senior-high"}
              onChange={(e) => setStudentFormData((prev) => ({ ...prev, studentType: e.target.value as StudentFormData["studentType"] }))}
              className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Label htmlFor="student-senior-high" className="text-sm font-medium cursor-pointer">
              Senior High School
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="student-college"
              name="studentType"
              value="college"
              checked={studentFormData.studentType === "college"}
              onChange={(e) => setStudentFormData((prev) => ({ ...prev, studentType: e.target.value as StudentFormData["studentType"] }))}
              className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Label htmlFor="student-college" className="text-sm font-medium cursor-pointer">
              College
            </Label>
          </div>
        </div>
      </div>

      {studentFormData.studentType === "college" && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground uppercase">STUDENT CLASSIFICATION</Label>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="college-freshman"
                name="collegeStudentType"
                value="freshman"
                checked={studentFormData.collegeStudentType === "freshman"}
                onChange={(e) =>
                  setStudentFormData((prev) => ({
                    ...prev,
                    collegeStudentType: e.target.value as StudentFormData["collegeStudentType"],
                    studentNumber: "",
                  }))
                }
                className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Label htmlFor="college-freshman" className="text-sm font-medium cursor-pointer">
                Freshman
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="college-transferee"
                name="collegeStudentType"
                value="transferee"
                checked={studentFormData.collegeStudentType === "transferee"}
                onChange={(e) =>
                  setStudentFormData((prev) => ({
                    ...prev,
                    collegeStudentType: e.target.value as StudentFormData["collegeStudentType"],
                    studentNumber: "",
                  }))
                }
                className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Label htmlFor="college-transferee" className="text-sm font-medium cursor-pointer">
                Transferee
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="college-sti-transferee"
                name="collegeStudentType"
                value="sti-transferee"
                checked={studentFormData.collegeStudentType === "sti-transferee"}
                onChange={(e) =>
                  setStudentFormData((prev) => ({
                    ...prev,
                    collegeStudentType: e.target.value as StudentFormData["collegeStudentType"],
                  }))
                }
                className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Label htmlFor="college-sti-transferee" className="text-sm font-medium cursor-pointer">
                STI Transferee
              </Label>
            </div>
          </div>

          {studentFormData.collegeStudentType === "sti-transferee" && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="studentNumber">
                Student Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 11-digit student number"
                value={studentFormData.studentNumber ?? ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  if (value.length <= 11) {
                    setStudentFormData((prev) => ({ ...prev, studentNumber: value }))
                  }
                }}
                maxLength={11}
                className={`border ${
                  studentFormData.studentNumber.length > 0 && studentFormData.studentNumber.length !== 11
                    ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                    : "border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                }`}
              />
              {studentFormData.studentNumber.length > 0 && studentFormData.studentNumber.length !== 11 && (
                <p className="text-sm text-red-500">Student number must be exactly 11 digits</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Enter first name"
            value={studentFormData.firstName ?? ""}
            onChange={(e) => setStudentFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            placeholder="Enter middle name"
            value={studentFormData.middleName ?? ""}
            onChange={(e) => setStudentFormData((prev) => ({ ...prev, middleName: e.target.value }))}
            className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Enter last name"
            value={studentFormData.lastName ?? ""}
            onChange={(e) => setStudentFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={studentFormData.dateOfBirth ?? ""}
          onChange={(e) => setStudentFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
          className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-base font-medium">Civil Status</Label>
          <Select
            value={studentFormData.civilStatus}
            onValueChange={(value) => setStudentFormData((prev) => ({ ...prev, civilStatus: value }))}
          >
            <SelectTrigger className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500">
              <SelectValue placeholder="Select civil status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="separated">Separated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-base font-medium">Gender</Label>
          <Select
            value={studentFormData.gender}
            onValueChange={(value) => setStudentFormData((prev) => ({ ...prev, gender: value }))}
          >
            <SelectTrigger className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Contact Details</Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="landline">Landline</Label>
            <Input
              id="landline"
              type="tel"
              placeholder="Enter landline number"
              value={studentFormData.landline ?? ""}
              onChange={(e) => setStudentFormData((prev) => ({ ...prev, landline: e.target.value }))}
              className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="Enter mobile number"
              value={studentFormData.mobileNumber ?? ""}
              onChange={(e) => setStudentFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
              className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={studentFormData.email ?? ""}
              onChange={(e) => setStudentFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold text-foreground uppercase">PROGRAMS</Label>

        {studentFormData.studentType === "college" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">College Programs</h4>
            {isEnrollment ? (
              <RadioGroup 
                value={studentFormData.programs[0] || ""}
                onValueChange={(value) => setStudentFormData(prev => ({ ...prev, programs: [value] }))}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bsit" id="student-bsit" className="border border-gray-400" />
                  <Label htmlFor="student-bsit" className="text-sm cursor-pointer">
                    BS Information Technology (BSIT)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bscs" id="student-bscs" className="border border-gray-400" />
                  <Label htmlFor="student-bscs" className="text-sm cursor-pointer">
                    BS Computer Science (BSCS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bshm" id="student-bshm" className="border border-gray-400" />
                  <Label htmlFor="student-bshm" className="text-sm cursor-pointer">
                    BS Hospitality Management (BSHM)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bstm" id="student-bstm" className="border border-gray-400" />
                  <Label htmlFor="student-bstm" className="text-sm cursor-pointer">
                    BS Tourism Management (BSTM)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bsba" id="student-bsba" className="border border-gray-400" />
                  <Label htmlFor="student-bsba" className="text-sm cursor-pointer">
                    BS Business Administration (BSBA)
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-bsit"
                    checked={studentFormData.programs.includes("bsit")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "bsit", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-bsit" className="text-sm cursor-pointer">
                    BS Information Technology (BSIT)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-bscs"
                    checked={studentFormData.programs.includes("bscs")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "bscs", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-bscs" className="text-sm cursor-pointer">
                    BS Computer Science (BSCS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-bshm"
                    checked={studentFormData.programs.includes("bshm")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "bshm", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-bshm" className="text-sm cursor-pointer">
                    BS Hospitality Management (BSHM)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-bstm"
                    checked={studentFormData.programs.includes("bstm")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "bstm", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-bstm" className="text-sm cursor-pointer">
                    BS Tourism Management (BSTM)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-bsba"
                    checked={studentFormData.programs.includes("bsba")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "bsba", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-bsba" className="text-sm cursor-pointer">
                    BS Business Administration (BSBA)
                  </Label>
                </div>
              </div>
            )}
          </div>
        )}

        {studentFormData.studentType === "senior-high" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Senior High School Programs</h4>
            {isEnrollment ? (
              <RadioGroup 
                value={studentFormData.programs[0] || ""}
                onValueChange={(value) => setStudentFormData(prev => ({ ...prev, programs: [value] }))}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="it-mobile" id="student-it-mobile" className="border border-gray-400" />
                  <Label htmlFor="student-it-mobile" className="text-sm cursor-pointer">
                    IT in Mobile App and Web Development
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="humms" id="student-humms" className="border border-gray-400" />
                  <Label htmlFor="student-humms" className="text-sm cursor-pointer">
                    Humanities and Social Sciences (HUMMS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="abm" id="student-abm" className="border border-gray-400" />
                  <Label htmlFor="student-abm" className="text-sm cursor-pointer">
                    Accountancy, Business, and Management (ABM)
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-it-mobile"
                    checked={studentFormData.programs.includes("it-mobile")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "it-mobile", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-it-mobile" className="text-sm cursor-pointer">
                    IT in Mobile App and Web Development
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-humms"
                    checked={studentFormData.programs.includes("humms")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "humms", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-humms" className="text-sm cursor-pointer">
                    Humanities and Social Sciences (HUMMS)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-abm"
                    checked={studentFormData.programs.includes("abm")}
                    onCheckedChange={(checked) => handleArrayChange("programs", "abm", checked as boolean)}
                    className="border border-gray-400"
                  />
                  <Label htmlFor="student-abm" className="text-sm cursor-pointer">
                    Accountancy, Business, and Management (ABM)
                  </Label>
                </div>
              </div>
            )}
          </div>
        )}

        {!studentFormData.studentType && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Please select your student type above to see available programs.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold text-foreground uppercase">LAST SCHOOL ATTENDED</Label>

        <div className="space-y-2">
          <Label htmlFor="lastSchoolAttended">Last School Attended</Label>
          <Select
            value={studentFormData.lastSchoolAttended}
            onValueChange={(value) => {
              setStudentFormData((prev) => {
                const updated = { ...prev, lastSchoolAttended: value }
                // If ALS A&E/PEPT is selected, automatically set school name
                if (value === "als-ae-pept") {
                  updated.schoolName = "ALS A&E/PEPT"
                } else {
                  // Clear school name when changing to other options
                  updated.schoolName = ""
                }
                return updated
              })
            }}
          >
            <SelectTrigger id="lastSchoolAttended" className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500">
              <SelectValue placeholder="Select last school attended" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="junior-high-school">Junior High School</SelectItem>
              <SelectItem value="senior-high-school">Senior High School</SelectItem>
              <SelectItem value="als-ae-pept">ALS A&E/PEPT</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {studentFormData.lastSchoolAttended === "als-ae-pept" ? (
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              value="ALS A&E/PEPT"
              disabled
              className="border border-gray-400 bg-muted"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Popover open={schoolPopoverOpen} onOpenChange={setSchoolPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="schoolName"
                  variant="outline"
                  role="combobox"
                  aria-expanded={schoolPopoverOpen}
                  className={cn(
                    "w-full justify-between border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500",
                    !studentFormData.schoolName && "text-muted-foreground"
                  )}
                  disabled={!studentFormData.lastSchoolAttended || loadingSchools}
                >
                  {loadingSchools
                    ? "Loading schools..."
                    : studentFormData.schoolName || (
                        !studentFormData.lastSchoolAttended
                          ? "Please select last school attended first"
                          : "Select school name"
                      )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="p-0" 
                align="start"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
              >
                <Command>
                  <CommandInput placeholder="Search schools..." />
                  <CommandList>
                    <CommandEmpty>No school found.</CommandEmpty>
                    <CommandGroup>
                      {schools.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={school.name}
                          onSelect={() => {
                            setStudentFormData((prev) => ({ ...prev, schoolName: school.name }))
                            setSchoolPopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              studentFormData.schoolName === school.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {school.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {studentFormData.studentType !== "senior-high" && (
          <div className="space-y-2">
            <Label htmlFor="programTrackStrand">Program/Track&Strand/Specialization</Label>
            <Input
              id="programTrackStrand"
              placeholder="Enter program, track & strand, or specialization"
              value={studentFormData.programTrackStrand ?? ""}
              onChange={(e) => setStudentFormData((prev) => ({ ...prev, programTrackStrand: e.target.value }))}
              className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
            />
          </div>
        )}
      </div>
    </div>
  )
}