"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function EvaluationPage() {
  const router = useRouter()
  const [surveyTitle, setSurveyTitle] = useState("")
  const [surveyDescription, setSurveyDescription] = useState("")
  const [showBuilder, setShowBuilder] = useState(false)
  const [recentEvaluations, setRecentEvaluations] = useState<Array<{ id: string; title: string; updatedAt: string }>>([])
  const [searchQuery, setSearchQuery] = useState("")

  type QuestionType = "short_answer" | "multiple_choice" | "rating"

  interface Question {
    id: string
    type: QuestionType
    text: string
    required: boolean
    options?: string[]
    scale?: number
  }

  const [questions, setQuestions] = useState<Question[]>([])

  const [newQuestionType, setNewQuestionType] = useState<QuestionType>("short_answer")
  const [newQuestionText, setNewQuestionText] = useState("")
  const [newQuestionRequired] = useState(true)
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["Option 1"])
  const [newQuestionScale, setNewQuestionScale] = useState<number>(5)

  const resetNewQuestion = () => {
    setNewQuestionType("short_answer")
    setNewQuestionText("")
    setNewQuestionOptions(["Option 1"])
    setNewQuestionScale(5)
  }

  const addOption = () => {
    setNewQuestionOptions(prev => [...prev, `Option ${prev.length + 1}`])
  }

  const updateOption = (index: number, value: string) => {
    setNewQuestionOptions(prev => prev.map((o, i) => (i === index ? value : o)))
  }

  const removeOption = (index: number) => {
    setNewQuestionOptions(prev => prev.filter((_, i) => i !== index))
  }

  const addQuestion = () => {
    if (!newQuestionText.trim()) return
    const q: Question = {
      id: crypto.randomUUID(),
      type: newQuestionType,
      text: newQuestionText.trim(),
      required: newQuestionRequired,
      options: newQuestionType === "multiple_choice" ? newQuestionOptions.filter(Boolean) : undefined,
      scale: newQuestionType === "rating" ? newQuestionScale : undefined,
    }
    setQuestions(prev => [...prev, q])
    resetNewQuestion()
  }

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions(prev => {
      const next = [...prev]
      const newIndex = index + dir
      if (newIndex < 0 || newIndex >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(newIndex, 0, item)
      return next
    })
  }

  const exportJSON = () => {
    const payload = {
      title: surveyTitle.trim(),
      description: surveyDescription.trim(),
      questions,
      version: 1,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${payload.title || "survey"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = () => {
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          <AdminBreadcrumbs />
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Evaluation</h1>
                <p className="text-muted-foreground">Create and manage evaluation forms for programs and activities</p>
              </div>
            </div>
          </div>

          {/* Start a new evaluation - like Google Forms landing */}
          {!showBuilder && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Start a new evaluation</h2>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground px-2 h-8">
                  Template gallery
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <button
                  onClick={() => setShowBuilder(true)}
                  className="group aspect-[3/4] w-full border border-border rounded-lg bg-card hover:bg-accent transition-colors flex flex-col items-center justify-center gap-3"
                >
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xl">
                    +
                  </div>
                  <span className="text-sm font-medium">Blank evaluation</span>
                </button>
                {/* Simple templates to mimic Google Forms cards */}
                <button
                  onClick={() => { setShowBuilder(true); setSurveyTitle("Program Feedback"); }}
                  className="group aspect-[3/4] w-full border border-border rounded-lg bg-card hover:bg-accent transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-12 w-10 rounded-sm bg-gradient-to-b from-primary/20 to-primary/5"></div>
                  <span className="text-xs text-muted-foreground">Program Feedback</span>
                </button>
                <button
                  onClick={() => { setShowBuilder(true); setSurveyTitle("Course Evaluation"); }}
                  className="group aspect-[3/4] w-full border border-border rounded-lg bg-card hover:bg-accent transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-12 w-10 rounded-sm bg-gradient-to-b from-primary/20 to-primary/5"></div>
                  <span className="text-xs text-muted-foreground">Course Evaluation</span>
                </button>
              </div>
            </div>
          )}

          {/* Recent evaluations */}
          {!showBuilder && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Recent evaluations</h2>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-56 h-8"
                  />
                  <div className="text-xs text-muted-foreground">Owned by anyone ▾</div>
                </div>
              </div>
              {recentEvaluations.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No evaluations yet. Use “Blank evaluation” above to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentEvaluations
                    .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(item => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">Updated {new Date(item.updatedAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {/* Survey Maker */}
          {showBuilder && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Survey Maker</CardTitle>
                  <CardDescription>Create and manage program evaluation surveys</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Back to evaluations</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Survey meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Survey Title</label>
                  <Input
                    placeholder="e.g. End-of-Semester Program Evaluation"
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Short Description</label>
                  <Input
                    placeholder="Purpose or audience"
                    value={surveyDescription}
                    onChange={(e) => setSurveyDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <Separator />

              {/* New question builder */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium">Question</label>
                    <Textarea
                      placeholder="Write your question"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newQuestionType} onValueChange={(v) => setNewQuestionType(v as any)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newQuestionType === "multiple_choice" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Choices</label>
                      <Button variant="outline" size="sm" onClick={addOption}>Add option</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {newQuestionOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                          />
                          <Button variant="outline" size="icon" onClick={() => removeOption(i)}>✕</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newQuestionType === "rating" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Scale</label>
                      <Select value={String(newQuestionScale)} onValueChange={(v) => setNewQuestionScale(Number(v))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[3,5,7,10].map(n => (
                            <SelectItem key={n} value={String(n)}>{n}-point</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Badge variant="secondary" className="h-10 flex items-center">
                        Preview: {Array.from({ length: newQuestionScale }).map((_, i) => (i + 1)).join(" · ")}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Required by default. You can mark optional later.
                  </div>
                  <Button onClick={addQuestion} disabled={!newQuestionText.trim()}>
                    Add question
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Questions table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Questions ({questions.length})</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={questions.length === 0}>Preview JSON</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Survey JSON</DialogTitle>
                      </DialogHeader>
                      <pre className="max-h-[60vh] overflow-auto text-xs p-4 bg-muted rounded-md">
{JSON.stringify({ title: surveyTitle, description: surveyDescription, questions }, null, 2)}
                      </pre>
                      <div className="flex justify-end">
                        <Button onClick={exportJSON}>Download JSON</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q, idx) => (
                      <TableRow key={q.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="max-w-[360px]">
                          <div className="text-sm">{q.text}</div>
                          <div className="text-xs text-muted-foreground">{q.required ? "Required" : "Optional"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {q.type === "short_answer" ? "Short Answer" : q.type === "multiple_choice" ? "Multiple Choice" : "Rating"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {q.type === "multiple_choice" && q.options?.length ? q.options.join(", ") : null}
                          {q.type === "rating" && q.scale ? `1–${q.scale}` : null}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}>
                            Up
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1}>
                            Down
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteQuestion(q.id)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {questions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          No questions yet. Add your first question above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}
        </main>
    </div>
  )
}
