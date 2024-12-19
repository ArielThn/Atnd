router.get('/veiculos-interesse', async (req, res) => {
    try {
      const result = await db.query('SELECT DISTINCT modelo FROM veiculo__interesse ORDER BY modelo ASC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar veículos de interesse:', error);
      res.status(500).json({ error: 'Erro ao buscar veículos de interesse' });
    }
  });