"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Settings, Plus, X } from "lucide-react"
import type { Club, ScheduleSlot } from "@/lib/types"

interface EditClubDialogProps {
  club: Club
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EditClubDialog({ club, open: controlledOpen, onOpenChange, onSuccess, trigger }: EditClubDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  const [name, setName] = useState(club.name)
  const [shortDescription, setShortDescription] = useState(club.shortDescription)
  const [description, setDescription] = useState(club.description)
  const [city, setCity] = useState(club.city)
  const [coverImage, setCoverImage] = useState(club.coverImage)
  const [categories, setCategories] = useState(club.categories.join(", "))
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(club.schedule)
  const [telegram, setTelegram] = useState(club.links.telegram || "")
  const [whatsapp, setWhatsapp] = useState(club.links.whatsapp || "")
  const [website, setWebsite] = useState(club.links.website || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setName(club.name)
    setShortDescription(club.shortDescription)
    setDescription(club.description)
    setCity(club.city)
    setCoverImage(club.coverImage)
    setCategories(club.categories.join(", "))
    setSchedule(club.schedule)
    setTelegram(club.links.telegram || "")
    setWhatsapp(club.links.whatsapp || "")
    setWebsite(club.links.website || "")
  }, [club])

  const addScheduleSlot = () => {
    setSchedule([...schedule, { day: "", time: "", room: "" }])
  }

  const removeScheduleSlot = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index))
  }

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
    const newSchedule = [...schedule]
    newSchedule[index][field] = value
    setSchedule(newSchedule)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const parsedCategories = categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)

      await api.clubs.update(club.id, {
        name,
        shortDescription,
        description,
        city,
        coverImage,
        categories: parsedCategories,
        schedule,
        links: {
          telegram: telegram || undefined,
          whatsapp: whatsapp || undefined,
          website: website || undefined,
        },
      })
      toast({
        title: "Изменения сохранены",
        description: "Информация о клубе успешно обновлена.",
      })
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      toast({
        title: "Ошибка обновления",
        description: err instanceof Error ? err.message : "Не удалось сохранить",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать клуб</DialogTitle>
          <DialogDescription>Управление информацией о клубе "{club.name}"</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Основное</TabsTrigger>
            <TabsTrigger value="description">Описание</TabsTrigger>
            <TabsTrigger value="schedule">Расписание</TabsTrigger>
            <TabsTrigger value="links">Контакты</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Название клуба</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Баскетбольный клуб NIS"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-short">Краткое описание</Label>
              <Input
                id="edit-short"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Кратко об основных активностях"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Город</Label>
                <Input
                  id="edit-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Кызылорда"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-categories">Категории (через запятую)</Label>
                <Input
                  id="edit-categories"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="Спорт, Баскетбол"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cover">Ссылка на обложку (URL)</Label>
              <Input
                id="edit-cover"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </TabsContent>

          <TabsContent value="description" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Полное описание клуба</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Подробное описание целей, программы и преимуществ клуба"
              />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Расписание занятий</Label>
              {schedule.map((slot, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="День (напр. Понедельник)"
                    value={slot.day}
                    onChange={(e) => updateScheduleSlot(index, "day", e.target.value)}
                  />
                  <Input
                    placeholder="Время (напр. 16:00-18:00)"
                    value={slot.time}
                    onChange={(e) => updateScheduleSlot(index, "time", e.target.value)}
                  />
                  <Input
                    placeholder="Место (напр. Спортзал)"
                    value={slot.room}
                    onChange={(e) => updateScheduleSlot(index, "room", e.target.value)}
                  />
                  {schedule.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeScheduleSlot(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addScheduleSlot}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить занятие
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (ссылка на группу/канал)</Label>
              <Input
                id="telegram"
                type="url"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="https://t.me/yourgroup"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (ссылка на чат)</Label>
              <Input
                id="whatsapp"
                type="url"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="https://wa.me/77771234567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Веб-сайт клуба</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} className="w-full mt-4" disabled={isLoading}>
          {isLoading ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
