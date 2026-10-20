import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageDrift, ScrollShift } from "@/components/parallax"

const features = [
  {
    title: "Доходы и расходы",
    text: "Зарплата, еда, транспорт и остальные категории в одном списке. Каждую запись можно изменить или удалить.",
  },
  {
    title: "Графики",
    text: "Столбцы по месяцам и круговая диаграмма расходов показывают, куда уходят деньги.",
  },
  {
    title: "Свой аккаунт",
    text: "Регистрация и вход отделяют ваши операции от чужих. Данные остаются в базе, а не только в браузере.",
  },
]

const steps = [
  { n: "01", title: "Создайте аккаунт", text: "Почта и пароль. После входа открывается личный трекер." },
  { n: "02", title: "Добавьте операции", text: "Укажите тип, сумму, категорию и дату." },
  { n: "03", title: "Смотрите итог", text: "Карточки баланса и графики пересчитываются сразу." },
]

export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <a href="#top" className="font-medium tracking-tight">
            Трекер
          </a>
          <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">Возможности</a>
            <a href="#preview" className="hover:text-foreground">Обзор</a>
            <a href="#steps" className="hover:text-foreground">Как начать</a>
          </nav>
          <Button asChild size="lg">
            <a href="/app/">Открыть трекер</a>
          </Button>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <PageDrift distance={140} className="pointer-events-none absolute -left-16 top-10 size-72 rounded-full bg-emerald-400/25 blur-3xl" >
            <span />
          </PageDrift>
          <PageDrift distance={-90} className="pointer-events-none absolute right-0 top-24 size-80 rounded-full bg-rose-400/20 blur-3xl">
            <span />
          </PageDrift>
          <PageDrift distance={220} className="pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-sky-400/15 blur-3xl">
            <span />
          </PageDrift>

          <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-center px-5 py-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary">Доходы, расходы и графики</Badge>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Видно, сколько пришло и куда ушло
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Личный трекер с регистрацией, итогами за месяц и объёмными графиками.
                Светлая и тёмная тема переключаются в один клик.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-11 px-5">
                  <a href="/app/">Начать учёт</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 px-5">
                  <a href="#preview">Посмотреть обзор</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-24">
          <ScrollShift from={40} to={-20}>
            <h2 className="text-3xl font-semibold tracking-tight">Что внутри</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Четыре вкладки: итоги, графики, новая операция и список.
            </p>
          </ScrollShift>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.text}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="preview" className="overflow-hidden bg-muted/50 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
            <ScrollShift from={60} to={-40}>
              <Badge variant="secondary">Параллакс при прокрутке</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Итог и графики двигаются с разной скоростью
              </h2>
              <p className="mt-3 text-muted-foreground">
                На экране учёта карточки показывают доход, расход и баланс.
                Рядом — сравнение месяцев и доли категорий.
              </p>
            </ScrollShift>
            <ScrollShift from={90} to={-70} className="relative">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Октябрь 2026</CardTitle>
                  <CardDescription>Пример сводки</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-3">
                      <p className="text-xs text-muted-foreground">Доход</p>
                      <p className="text-lg font-semibold text-emerald-700">10 300 ₽</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/10 p-3">
                      <p className="text-xs text-muted-foreground">Расход</p>
                      <p className="text-lg font-semibold text-rose-700">10 290 ₽</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Баланс</p>
                      <p className="text-lg font-semibold">10 ₽</p>
                    </div>
                  </div>
                  <div className="flex h-36 items-end gap-3 rounded-lg bg-muted/70 p-4">
                    <div className="h-[78%] w-10 rounded-t-md bg-emerald-600" />
                    <div className="h-[76%] w-10 rounded-t-md bg-rose-600" />
                    <div className="ml-auto size-24 rounded-full bg-[conic-gradient(#e07a3d_0_78%,#c44536_78%_92%,#d4a017_92%_100%)]" />
                  </div>
                </CardContent>
              </Card>
            </ScrollShift>
          </div>
        </section>

        <section id="steps" className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="text-3xl font-semibold tracking-tight">Как начать</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <ScrollShift key={step.n} from={30 + index * 16} to={-10}>
                <Card>
                  <CardHeader>
                    <CardDescription>{step.n}</CardDescription>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.text}</p>
                  </CardContent>
                </Card>
              </ScrollShift>
            ))}
          </div>
        </section>

        <section className="px-5 pb-24">
          <ScrollShift from={40} to={-20}>
            <Card className="mx-auto max-w-6xl bg-foreground text-background">
              <CardHeader className="items-start gap-4 px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-3xl text-background">Откройте свой учёт</CardTitle>
                  <CardDescription className="mt-2 text-background/70">
                    Регистрация занимает меньше минуты.
                  </CardDescription>
                </div>
                <Button asChild size="lg" variant="secondary" className="h-11 px-5">
                  <a href="/app/">Перейти в трекер</a>
                </Button>
              </CardHeader>
            </Card>
          </ScrollShift>
        </section>
      </main>
    </div>
  )
}
