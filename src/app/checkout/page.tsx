import { Suspense } from 'react'
import { CheckoutClient } from '../../components/CheckoutClient'
import { AppBar, Container } from '../../components/ui'

export default function CheckoutPage() {
  return (
    <>
      <AppBar />
      <Container style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Suspense fallback={<p>Φόρτωση…</p>}>
          <CheckoutClient />
        </Suspense>
      </Container>
    </>
  )
}
